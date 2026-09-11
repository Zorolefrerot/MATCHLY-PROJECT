// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.10.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 67529246,
  expiresAt: "2026-09-18T12:57:34Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34601493231/artifacts/10264293080",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
