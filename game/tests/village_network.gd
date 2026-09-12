extends SceneTree
## Real WSS fixture, never a production account/service. Both peers use the real
## visit, avatar, HUD and transport; test-only trust of a generated local CA.
class FixtureAPI extends CharacterAccountAPI:
	var endpoint: String
	var ca: String
	func village_session() -> Dictionary:
		return {"url":endpoint,"headers":PackedStringArray(["Authorization: Bearer "+_token])}

class TrustedFixtureLink extends VillageLink:
	func _open_socket(session: Dictionary) -> Error:
		var fixture: FixtureAPI = api as FixtureAPI
		var cert := X509Certificate.new()
		if cert.load(fixture.ca) != OK: return FAILED
		return peer.connect_to_url(session["url"],TLSOptions.client(cert))

class NetworkVisit extends KonohaVisit:
	func create_village_link() -> VillageLink:
		return TrustedFixtureLink.new()

var failures: int = 0
var finishing: bool = false
var fixture: Dictionary
var visits: Array[KonohaVisit] = []

func _initialize() -> void:
	call_deferred("run")

func check(value: bool, message: String) -> void:
	if value: print("PASS: "+message)
	else:
		failures += 1
		push_error("TEST FAILED: "+message)

func wait_for(condition: Callable, seconds: float = 8.0) -> bool:
	var elapsed: float = 0.0
	while not condition.call() and elapsed < seconds:
		await create_timer(0.05).timeout
		elapsed += 0.05
	return bool(condition.call())

func join_player(index: int) -> KonohaVisit:
	var account := FixtureAPI.new()
	account.endpoint = fixture["url"]
	account.ca = fixture["ca"]
	account._token = fixture["players"][index]["token"]
	account.profile = fixture["players"][index]["profile"].duplicate(true)
	root.add_child(account)
	var visit := NetworkVisit.new()
	visit.account_profile = account.profile.duplicate(true)
	visit.api = account
	root.add_child(visit)
	visits.append(visit)
	return visit

func finish() -> void:
	if finishing: return
	finishing = true
	call_deferred("_shutdown")

func _shutdown() -> void:
	for visit in visits:
		visit.finish()
		visit.api.queue_free()
		visit.queue_free()
	visits.clear()
	await process_frame
	# Let the audio mixer retire the village Ogg playbacks after node disposal.
	await create_timer(0.15,true).timeout
	print("IDREM_VILLAGE_NETWORK_FAILURES=%d" % failures)
	quit(0 if failures == 0 else 1)

func run() -> void:
	var config: String = OS.get_environment("IDREM_VILLAGE_FIXTURE")
	if config.is_empty():
		check(false,"network test requires its disposable local fixture")
		finish()
		return
	fixture = JSON.parse_string(FileAccess.get_file_as_string(config))
	# These actions normally come from the training scene before entering Konoha.
	for action in ["move_left","move_right","move_forward","move_back","sprint","jump"]:
		if not InputMap.has_action(action): InputMap.add_action(action)
	var a: KonohaVisit = join_player(0)
	var b: KonohaVisit = join_player(1)
	var aid: int = int(a.account_profile["character"]["id"])
	var bid: int = int(b.account_profile["character"]["id"])
	check(await wait_for(func() -> bool: return a.village_link.connected and b.village_link.connected),"two admitted native clients authenticate over verified local WSS")
	if not a.village_link.connected or not b.village_link.connected:
		finish()
		return
	check(await wait_for(func() -> bool: return a.remote_avatars.has(bid) and b.remote_avatars.has(aid)),"both village scenes create the other account avatar")
	if not a.remote_avatars.has(bid) or not b.remote_avatars.has(aid):
		finish()
		return
	var remote: VillageAvatar = b.remote_avatars[aid]
	check(remote.nameplate.text == a.account_profile["character"]["name"] and remote.fighter.appearance == CharacterAppearance.sanitize(a.account_profile["appearance"]),"remote name and male/female appearance come from the account")
	check(remote.fighter.collision_layer == 0 and remote.fighter.collision_mask == 0,"remote visuals cannot collide; combat remains server-authoritative")
	a.hud.move_vector = Vector2(0,-1)
	check(await wait_for(func() -> bool: return remote.motion == "walk"),"walking reaches the other native client")
	a.hud.sprinting = true
	check(await wait_for(func() -> bool: return remote.motion == "run"),"running reaches the other native client")
	a.player.jump()
	check(await wait_for(func() -> bool: return remote.motion == "jump"),"jump height and animation reach the other native client")
	a._clear_inputs()
	check(await wait_for(func() -> bool: return remote.motion == "idle"),"stopping reaches the other native client")
	check(await wait_for(func() -> bool: return remote.position.distance_to(a.player.position) < 0.6),"remote interpolation converges without simulating local collisions")
	# The same two native clients can now opt into the ephemeral server duel.
	a._action("combat_join")
	b._action("combat_join")
	check(await wait_for(func() -> bool: return a.combat_state.get("status") == "active" and b.combat_state.get("status") == "active"),"two native clients start the online duel")
	check(await wait_for(func() -> bool: return a.player.position.distance_to(b.player.position) > 4 and a.player.position.distance_to(b.player.position) < 8),"server places duelists apart before the first attack")
	a._action("combat_skill_0")
	check(await wait_for(func() -> bool: return b.player.health < 120),"textured technique hit is resolved and synchronized by the server")
	var health_after_skill: float = b.player.health
	a._action("combat_ultimate")
	check(await wait_for(func() -> bool: return b.player.health < health_after_skill,2.5),"clan ultimate waits through its windup then applies one level-scaled hit")
	check(a.combat_effects.get_child_count() > 0 and b.combat_effects.get_child_count() > 0,"both clients render the shared image-texture combat spectacle")
	a._action("combat_leave")
	check(await wait_for(func() -> bool: return a.combat_state.is_empty() and b.combat_state.is_empty()),"leaving the duel removes the ephemeral combat state")
	a.open_chat()
	check(a.hud.blocked and a.chat_panel.visible and not a.hud.menu_panel.visible,"touch chat blocks movement without pausing network presence")
	a.chat_panel.input.text = "Bonjour [b]Konoha[/b]"
	a.chat_panel._submit()
	check(await wait_for(func() -> bool: return b.chat_panel.lines.size() == 1 and a.chat_panel.pending == -1),"nearby RP message and acknowledgement pass through real WSS")
	check(b.chat_panel.lines[0].begins_with("[RP]") and not b.chat_panel.history.bbcode_enabled and b.chat_panel.history.text.contains("[b]Konoha[/b]"),"received content stays literal plaintext, never BBCode")
	a.chat_panel.channel.select(1)
	a.chat_panel.input.text = "Pause hors personnage"
	a.chat_panel._submit()
	check(await wait_for(func() -> bool: return b.chat_panel.lines.size() == 2),"HRP uses the same proximity delivery with a distinct label")
	check(b.chat_panel.lines[1].begins_with("[HRP]"),"HRP label is preserved")
	a.resume_visit()
	a.hud.move_vector = Vector2(0,-1)
	a.hud.sprinting = true
	check(await wait_for(func() -> bool: return a.player.position.distance_to(b.player.position) > 15,5),"one native player can leave proximity along the village road")
	a._clear_inputs()
	await create_timer(0.35).timeout
	a.open_chat()
	a.chat_panel.input.text = "Message hors portée"
	a.chat_panel._submit()
	check(await wait_for(func() -> bool: return a.chat_panel.pending == -1 and a.chat_panel.lines.size() == 3),"sender receives an acknowledgement even alone")
	check(b.chat_panel.lines.size() == 2,"out-of-range player receives no chat message")
	a.resume_visit()
	a.village_link.set_active(false)
	check(await wait_for(func() -> bool: return not b.remote_avatars.has(aid)),"backgrounding removes the avatar from the other native scene")
	check(a.remote_avatars.is_empty() and not a.chat_panel.online,"disconnect clears stale avatars and disables sending")
	a.village_link.set_active(true)
	check(await wait_for(func() -> bool: return a.village_link.connected and b.remote_avatars.has(aid)),"focus return reconnects automatically")
	check(a.player.position.distance_to(KonohaMap.SPAWN) < 1 and b.remote_avatars.size() == 1,"reconnect uses arrival point and does not duplicate avatars")
	a.village_link.started_at = a.village_link.clock-60
	var replacement: KonohaVisit = join_player(0)
	check(await wait_for(func() -> bool: return replacement.village_link.connected and not a.village_link.enabled),"second connection for same account stops the old client without reconnect fighting")
	check(a.api.profile.is_empty() and b.remote_avatars.size() == 1,"replaced client drops credentials and observer keeps one account avatar")
	replacement.finish()
	check(await wait_for(func() -> bool: return not b.remote_avatars.has(aid)),"leaving the village removes presence immediately")
	check(not b.village_link.api.profile.is_empty() and b.mission["revision"] == 0,"network activity preserves the other account and personal mission")
	finish()
