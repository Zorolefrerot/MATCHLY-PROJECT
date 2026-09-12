// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.11.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 71721683,
  expiresAt: "2026-09-19T23:33:11Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34725613010/artifacts/10307567913",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
