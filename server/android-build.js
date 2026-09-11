// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.9.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 67075079,
  expiresAt: "2026-09-17T12:00:52Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34474189586/artifacts/10150821501",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
