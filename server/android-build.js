// Last verified installer only. Never advertise an uncompiled development version.
export const androidBuild = Object.freeze({
  version: "0.12.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 79496383,
  expiresAt: "2026-09-20T12:00:48Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34755818249/artifacts/10317726413",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: true,
  };
}
