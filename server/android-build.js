// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.12.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 79883769,
  expiresAt: "2026-09-21T09:26:30Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34827750044/artifacts/10340822219",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
