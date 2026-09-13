// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.12.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 79878503,
  expiresAt: "2026-09-20T22:57:36Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34788167226/artifacts/10326823243",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
