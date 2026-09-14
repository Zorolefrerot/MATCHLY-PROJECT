// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.12.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 79884704,
  expiresAt: "2026-09-21T09:18:52Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34827049533/artifacts/10341080082",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
