"""Build a Blender preview of the fourteen Konoha clan sanctuaries.

The JPGs in ../sanctuaries are visual references. This script turns their
silhouettes into editable Blender geometry: bodies, tiered roofs, torii,
steps, courtyards and lanterns. It deliberately does not put the JPGs on
billboards or use them as runtime textures.

Run with Blender 4.x in background mode:
    blender -b --python build_sanctuaries.py
"""
from __future__ import annotations

import math
import os
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "docs" / "images"
BLENDER_OUT = ROOT / "art_sources" / "konoha" / "blender"
OUT.mkdir(parents=True, exist_ok=True)
BLENDER_OUT.mkdir(parents=True, exist_ok=True)

CLANS = [
    "Uchiwa", "Uzumaki", "Senju", "Hyūga", "Akimichi", "Yamanaka",
    "Aburame", "Inuzuka", "Fushiguro", "Itadori", "Kurosaki", "Shunsui",
    "Yeager", "Ackerman",
]

# Warm, readable materials chosen for a mobile-friendly, hand-painted village
# look while retaining the silhouette differences from the imported references.
PALETTE = {
    "wood": (0.22, 0.09, 0.055, 1.0),
    "wood_light": (0.42, 0.20, 0.10, 1.0),
    "plaster": (0.78, 0.68, 0.49, 1.0),
    "stone": (0.30, 0.32, 0.34, 1.0),
    "red": (0.62, 0.075, 0.045, 1.0),
    "red_light": (0.88, 0.22, 0.08, 1.0),
    "gold": (0.95, 0.57, 0.10, 1.0),
    "tile": (0.075, 0.10, 0.14, 1.0),
    "tile_blue": (0.10, 0.19, 0.27, 1.0),
    "paper": (0.97, 0.80, 0.45, 1.0),
    "green": (0.14, 0.34, 0.22, 1.0),
    "water": (0.09, 0.36, 0.47, 1.0),
    "ground": (0.52, 0.34, 0.20, 1.0),
    "path": (0.65, 0.47, 0.30, 1.0),
    "black": (0.015, 0.012, 0.018, 1.0),
}


def material(name: str, color: tuple[float, float, float, float], metallic=0.0, roughness=0.65):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = color
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return m


MATS = {}


def collection(name: str):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


def move_to(obj, c):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    c.objects.link(obj)
    return obj


def cube(name, loc, dims, mat, c, bevel=0.0, rot=0.0):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=(0.0, 0.0, rot))
    o = move_to(bpy.context.object, c)
    o.name = name
    o.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(MATS[mat] if isinstance(mat, str) else mat)
    if bevel:
        mod = o.modifiers.new("soft_edges", "BEVEL")
        mod.width = bevel
        mod.segments = 2
    return o


def cylinder(name, loc, radius, depth, mat, c, vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    o = move_to(bpy.context.object, c)
    o.name = name
    o.data.materials.append(MATS[mat] if isinstance(mat, str) else mat)
    return o


def roof(name, x, y, z, width, depth, height, mat, c, flare=0.85):
    """A low-poly Japanese hipped roof with a smaller upper ridge."""
    w, d = width / 2, depth / 2
    tw, td = w * (1.0 - flare * 0.42), d * (1.0 - flare * 0.42)
    verts = [
        (-w, -d, 0), (w, -d, 0), (w, d, 0), (-w, d, 0),
        (-tw, -td, height), (tw, -td, height), (tw, td, height), (-tw, td, height),
    ]
    faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (4, 0, 3, 7)]
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata([(x + vx, y + vy, z + vz) for vx, vy, vz in verts], [], faces)
    mesh.materials.append(MATS[mat])
    o = bpy.data.objects.new(name, mesh)
    c.objects.link(o)
    return o


def roof_cap(name, x, y, z, width, depth, mat, c):
    return cube(name, (x, y, z), (width, depth, 0.18), mat, c, bevel=0.04)


def stairs(x, y, z, width, count, run, rise, mat, c):
    for i in range(count):
        cube(f"stairs_{i}", (x, y + i * run, z + (i + 0.5) * rise), (width, run * 1.12, (i + 1) * rise), mat, c, bevel=0.035)


def torii(x, y, z, width, height, c, mat="red"):
    post_w = 0.32
    cube("torii_post_L", (x - width / 2, y, z + height / 2), (post_w, post_w, height), mat, c, bevel=0.05)
    cube("torii_post_R", (x + width / 2, y, z + height / 2), (post_w, post_w, height), mat, c, bevel=0.05)
    cube("torii_beam", (x, y, z + height - 0.36), (width + 1.1, 0.42, 0.34), mat, c, bevel=0.07)
    cube("torii_lintel", (x, y, z + height - 0.02), (width + 1.55, 0.26, 0.18), "black", c, bevel=0.04)


def lantern(x, y, z, c, mat="gold"):
    cylinder("lantern_base", (x, y, z + 0.25), 0.42, 0.5, "stone", c, 8)
    cube("lantern_body", (x, y, z + 0.85), (0.62, 0.62, 0.9), "paper", c, bevel=0.05)
    roof("lantern_roof", x, y, z + 1.28, 0.92, 0.92, 0.24, mat, c, 0.7)


def body(name, x, y, z, width, depth, height, wall, roof_mat, c, roof_height=1.15):
    cube(name + "_body", (x, y, z + height / 2), (width, depth, height), wall, c, bevel=0.08)
    # Dark entrance and warm paper windows give the models an authored facade.
    cube(name + "_door", (x, y - depth / 2 - 0.012, z + height * 0.34), (width * 0.22, 0.035, height * 0.55), "wood", c)
    for side in (-1, 1):
        cube(name + "_window", (x + side * width * 0.25, y - depth / 2 - 0.018, z + height * 0.6), (width * 0.17, 0.035, height * 0.22), "paper", c)
    roof(name + "_roof", x, y, z + height - 0.04, width + 1.0, depth + 1.0, roof_height, roof_mat, c, 0.95)
    roof_cap(name + "_ridge", x, y, z + height + roof_height + 0.04, width * 0.24, depth * 0.90, roof_mat, c)


def pagoda(x, y, z, tiers, scale, wall, roof_mat, c, torii_mat="red"):
    for i in range(tiers):
        s = scale * (1.0 - i * 0.12)
        h = scale * 1.22
        body(f"tier_{i}", x, y, z + i * h, 4.0 * s, 3.25 * s, h, wall, roof_mat, c, 0.72 * scale)
        if i < tiers - 1:
            cube(f"balcony_{i}", (x, y, z + (i + 1) * h - 0.04), (4.55 * s, 3.75 * s, 0.16), roof_mat, c, bevel=0.03)
    torii(x, y - 3.3 * scale, z, 3.7 * scale, 3.4 * scale, c, torii_mat)
    stairs(x, y - 6.0 * scale, z, 2.5 * scale, 5, 0.55 * scale, 0.17 * scale, "stone", c)
    lantern(x - 3.1 * scale, y - 4.4 * scale, z, c)
    lantern(x + 3.1 * scale, y - 4.4 * scale, z, c)


def courtyard(x, y, z, scale, wall, roof_mat, c, red_torii=True):
    body("main", x, y + 0.55 * scale, z, 4.7 * scale, 3.0 * scale, 3.0 * scale, wall, roof_mat, c, 0.88 * scale)
    for side in (-1, 1):
        body("wing", x + side * 3.35 * scale, y + 1.0 * scale, z, 2.0 * scale, 4.3 * scale, 2.05 * scale, wall, roof_mat, c, 0.68 * scale)
    cube("courtyard_floor", (x, y - 2.2 * scale, z + 0.04), (9.4 * scale, 3.0 * scale, 0.12), "green", c)
    torii(x, y - 4.4 * scale, z, 4.8 * scale, 3.6 * scale, c, "red" if red_torii else "wood")
    stairs(x, y - 6.0 * scale, z, 2.4 * scale, 5, 0.46 * scale, 0.15 * scale, "stone", c)
    for side in (-1, 1): lantern(x + side * 4.4 * scale, y - 4.8 * scale, z, c)


def cliff_compound(x, y, z, scale, wall, roof_mat, c):
    body("cliff_main", x, y, z, 4.4 * scale, 3.5 * scale, 3.8 * scale, wall, roof_mat, c, 1.0 * scale)
    for side in (-1, 1):
        body("cliff_wing", x + side * 4.6 * scale, y + 0.4 * scale, z, 1.7 * scale, 3.0 * scale, 2.5 * scale, wall, roof_mat, c, 0.72 * scale)
    torii(x, y - 3.5 * scale, z, 5.5 * scale, 4.0 * scale, c, "wood")
    stairs(x, y - 7.0 * scale, z, 2.6 * scale, 6, 0.50 * scale, 0.18 * scale, "stone", c)


def build_variant(index, x, y, z, c):
    # Each branch follows the corresponding reference silhouette and material cues.
    if index == 0:       # Uchiwa: tall dark multi-tier pagoda, red gate.
        pagoda(x, y, z, 3, 1.25, "wood", "tile", c, "red")
    elif index == 1:     # Uzumaki: open red courtyard and broad circular gate.
        courtyard(x, y, z, 1.10, "red", "gold", c)
        cylinder("spiral_pool", (x, y - 2.5, z + 0.13), 1.0, 0.16, "water", c, 24)
    elif index == 2:     # Senju: pale, high four-tier landmark.
        pagoda(x, y, z, 4, 1.12, "plaster", "gold", c, "wood")
    elif index == 3:     # Hyūga: symmetrical cliff residence with blue tile roofs.
        cliff_compound(x, y, z, 1.05, "plaster", "tile_blue", c)
    elif index == 4:     # Akimichi: wide low red/gold compound.
        courtyard(x, y, z, 1.30, "red", "gold", c)
        cube("wide_plaza", (x, y - 2.35, z + 0.10), (10.5, 3.0, 0.16), "path", c)
    elif index == 5:     # Yamanaka: narrow five-tier wooden sanctuary.
        pagoda(x, y, z, 5, 0.88, "wood", "tile", c, "red")
    elif index == 6:     # Aburame: minimal dark hall behind a heavy wooden torii.
        torii(x, y - 3.0, z, 6.0, 4.3, c, "wood")
        body("insect_hall", x, y, z, 4.0, 3.8, 3.8, "stone", "tile", c, 0.85)
        for side in (-1, 1): lantern(x + side * 3.5, y - 3.3, z, c, "tile_blue")
    elif index == 7:     # Inuzuka: rugged timber cliff house.
        cliff_compound(x, y, z, 1.12, "wood", "tile", c)
        cube("kennel", (x + 4.0, y - 1.0, z + 0.8), (2.0, 2.2, 1.5), "wood_light", c, bevel=0.08)
    elif index == 8:     # Fushiguro: red gate and compact dark pagoda.
        torii(x, y - 3.0, z, 5.7, 4.1, c, "red")
        pagoda(x, y + 0.3, z, 3, 1.0, "red", "red", c, "red")
    elif index == 9:     # Itadori: strong red/gold central body.
        body("impact_hall", x, y, z, 4.7, 3.6, 4.2, "red", "gold", c, 1.0)
        torii(x, y - 3.2, z, 5.8, 4.3, c, "red")
        stairs(x, y - 6.4, z, 2.7, 5, 0.52, 0.17, "stone", c)
    elif index == 10:    # Kurosaki: pale pagoda with glass side tower.
        pagoda(x, y, z, 4, 1.0, "plaster", "gold", c, "wood")
        cube("glass_tower", (x + 4.0, y + 0.2, z + 2.3), (1.0, 1.7, 4.6), "water", c, bevel=0.08)
    elif index == 11:    # Shunsui: low garden courtyard.
        courtyard(x, y, z, 1.0, "plaster", "gold", c, False)
        for side in (-1, 1): lantern(x + side * 4.3, y - 2.4, z, c)
    elif index == 12:    # Yeager: stone cliff monument with wooden gate.
        cliff_compound(x, y, z, 1.20, "stone", "tile", c)
        cube("monument", (x, y + 0.3, z + 5.2), (1.1, 0.55, 2.0), "stone", c)
    else:               # Ackerman: elegant pale compound with blue tile.
        courtyard(x, y, z, 1.20, "plaster", "tile_blue", c, True)


def label(text, x, y, z, c):
    curve = bpy.data.curves.new(text + "Curve", "FONT")
    curve.body = text.upper()
    curve.align_x = "CENTER"
    curve.size = 0.42
    curve.extrude = 0.01
    obj = bpy.data.objects.new(text + "Label", curve)
    c.objects.link(obj)
    obj.location = (x, y, z)
    obj.rotation_euler = (math.radians(68), 0.0, 0.0)
    curve.materials.append(MATS["paper"])
    return obj


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    global MATS
    MATS = {k: material(k, v, 0.18 if k == "gold" else 0.0, 0.45 if k in {"tile", "tile_blue", "gold"} else 0.72) for k, v in PALETTE.items()}
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 3
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(OUT / "konoha-14-sanctuaries-blender-preview.png")
    scene.world = bpy.data.worlds.new("KonohaNight")
    scene.world.use_nodes = True
    scene.world.color = (0.025, 0.018, 0.035)
    world_nodes = scene.world.node_tree.nodes
    world_nodes["Background"].inputs["Color"].default_value = (0.018, 0.025, 0.05, 1.0)
    world_nodes["Background"].inputs["Strength"].default_value = 0.55

    floor_c = collection("Konoha_Sanctuaries_Preview")
    cube("preview_ground", (0, 0, -0.22), (54, 50, 0.4), "ground", floor_c, bevel=0.12)
    # A simple tiled path makes the individual plinths readable in the render.
    for col in range(4):
        for row in range(4):
            x = -19.5 + col * 13.0
            y = 13.0 - row * 13.0
            cube("plinth", (x, y, 0.06), (10.5, 10.5, 0.22), "path", floor_c, bevel=0.10)
            cube("path", (x, y - 4.7, 0.19), (1.5, 3.3, 0.10), "stone", floor_c, bevel=0.03)

    for i, clan in enumerate(CLANS):
        col, row = i % 4, i // 4
        x = -19.5 + col * 13.0
        y = 13.0 - row * 13.0
        c = collection(f"Sanctuary_{i+1:02d}_{clan}")
        build_variant(i, x, y, 0.18, c)
        label(clan, x, y + 4.7, 0.34, c)

    bpy.ops.object.camera_add(location=(37.0, -51.0, 49.0))
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 66.0
    look_at(camera, (0.0, -6.0, 2.0))
    scene.camera = camera
    camera.data.lens = 50

    bpy.ops.object.light_add(type="AREA", location=(0.0, -5.0, 42.0))
    key = bpy.context.object
    key.data.energy = 4200
    key.data.shape = "DISK"
    key.data.size = 30
    look_at(key, (0, 0, 0))
    bpy.ops.object.light_add(type="AREA", location=(-30.0, 25.0, 18.0))
    fill = bpy.context.object
    fill.data.energy = 2400
    fill.data.size = 20
    look_at(fill, (0, 0, 2))
    bpy.ops.object.light_add(type="AREA", location=(30.0, 16.0, 12.0))
    rim = bpy.context.object
    rim.data.energy = 2600
    rim.data.size = 15
    look_at(rim, (0, -5, 3))

    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 1.5
    return scene


if __name__ == "__main__":
    scene = setup_scene()
    blend_path = BLENDER_OUT / "konoha_14_sanctuaries_preview.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    # Export a single GLB containing named collections; it is a preview asset,
    # not yet wired into the Godot runtime.
    try:
        bpy.ops.export_scene.gltf(filepath=str(BLENDER_OUT / "konoha_14_sanctuaries_preview.glb"), export_format="GLB")
        runtime_dir = ROOT / "game" / "assets" / "konoha" / "sanctuaries"
        runtime_dir.mkdir(parents=True, exist_ok=True)
        for i, clan in enumerate(CLANS):
            x = -19.5 + (i % 4) * 13.0
            y = 13.0 - (i // 4) * 13.0
            c = bpy.data.collections.get(f"Sanctuary_{i+1:02d}_{clan}")
            objects = list(c.objects) if c else []
            if not objects:
                continue
            offset = Vector((x, y, 0.0))
            for obj in objects:
                obj.matrix_world.translation -= offset
                obj.select_set(True)
            bpy.context.view_layer.objects.active = objects[0]
            safe_name = clan.lower().replace("ū", "u").replace("é", "e")
            bpy.ops.export_scene.gltf(
                filepath=str(runtime_dir / f"{i+1:02d}_{safe_name}.glb"),
                export_format="GLB",
                use_selection=True,
            )
            for obj in objects:
                obj.matrix_world.translation += offset
                obj.select_set(False)
    except Exception as exc:
        print("GLB export skipped:", exc)
    bpy.ops.render.render(write_still=True)
    print("BLENDER_SANCTUARIES_RENDERED", scene.render.filepath)
