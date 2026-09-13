// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.11.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 76601665,
  expiresAt: "2026-09-20T08:54:12Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34748600217/artifacts/10315530135",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
