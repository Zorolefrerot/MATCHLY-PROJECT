// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.12.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 80218262,
  expiresAt: "2026-09-21T09:46:12Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34829507927/artifacts/10341905977",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
