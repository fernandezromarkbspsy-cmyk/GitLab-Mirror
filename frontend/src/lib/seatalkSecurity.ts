const SEA_TALK_SDK_ORIGIN = "https://static.cdn.haiserve.com";

export function isAllowedSeaTalkSdkUrl(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.origin === SEA_TALK_SDK_ORIGIN &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
