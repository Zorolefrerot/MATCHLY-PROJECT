// Public release asset; the website route still checks the account admission
// before redirecting, but friends no longer need a GitHub account or an Actions
// artifact session to download the installer.
export const androidBuild = Object.freeze({
  version: "0.12.0",
  name: "idrem-zenkai-training-debug.apk",
  bytes: 72911948,
  expiresAt: "2099-12-31T23:59:59Z",
  url: "https://github.com/Zorolefrerot/MATCHLY-PROJECT/releases/download/android-latest/idrem-zenkai-training-debug.apk",
});
export function downloadInfo(now = Date.now()) {
  const { url, ...info } = androidBuild;
  return {
    ...info,
    available: now < Date.parse(info.expiresAt),
    requiresGithub: false,
  };
}
