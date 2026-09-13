// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.11.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 73792876,
  expiresAt: "2026-09-20T00:04:48Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34726938557/artifacts/10308280471",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
