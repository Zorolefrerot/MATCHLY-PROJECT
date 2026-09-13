// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.12.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 79880070,
  expiresAt: "2026-09-20T22:43:54Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34787535451/artifacts/10327187130",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
