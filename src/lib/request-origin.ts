function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

export function getRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const fallbackProtocol = requestUrl.protocol.replace(":", "") || "https";
  const forwardedProtocol = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : fallbackProtocol;
  const host =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ||
    firstHeaderValue(request.headers.get("host")) ||
    requestUrl.host;

  return `${protocol}://${host}`.replace(/\/$/, "");
}
