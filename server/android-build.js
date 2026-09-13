// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.11.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 77257892,
  expiresAt: "2026-09-20T10:03:17Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34750747691/artifacts/10316225286",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
