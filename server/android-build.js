// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.11.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 76600993,
  expiresAt: "2026-09-20T09:04:16Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34748819351/artifacts/10315271690",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
