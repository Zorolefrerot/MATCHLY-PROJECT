// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.12.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 79878238,
  expiresAt: "2026-09-20T22:19:31Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34786339500/artifacts/10325969631",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
