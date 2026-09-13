// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.12.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 79595456,
  expiresAt: "2026-09-20T13:50:03Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34760824120/artifacts/10318886714",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
