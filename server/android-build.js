// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.11.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 68909306,
  expiresAt: "2026-09-19T21:17:09Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34719396621/artifacts/10305958374",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
