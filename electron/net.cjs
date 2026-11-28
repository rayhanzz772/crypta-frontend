const crypto = require("node:crypto");
const config = require("./config.cjs");

const MAX_BODY_BYTES = 250 * 1024 * 1024;
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);
const BLOCKED_HEADERS = new Set(["host", "cookie", "content-length", "origin", "referer"]);

let apiSession = null;

const getApiSession = () => {
  if (!apiSession) {
    const { session } = require("electron");
    apiSession = session.fromPartition("persist:crypta");
  }
  return apiSession;
};

const resolveUrl = (path) => {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Invalid request path");
  }
  return config.API_BASE_URL + path;
};

const sanitizeHeaders = (headers = {}) => {
  const result = {};

  for (const [key, value] of Object.entries(headers)) {
    if (value == null || BLOCKED_HEADERS.has(key.toLowerCase())) continue;
    result[key] = String(value);
  }

  return result;
};

// Origin is stripped from caller-supplied headers above, so the transport is the
// only writer — the renderer cannot spoof the value the CSRF guard sees.
const attachOrigin = (headers, origin) => {
  const result = { ...headers };
  if (!result.Origin && !result.origin) result.Origin = origin;
  return result;
};

// Escaping quotes/newlines prevents header injection inside the multipart part.
const multipartToken = (value) => String(value).replace(/["\r\n]/g, "_");

const buildMultipart = ({ fields = {}, files = [] } = {}) => {
  const boundary = `----crypta${crypto.randomBytes(12).toString("hex")}`;
  const chunks = [];

  for (const [name, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${multipartToken(name)}"\r\n\r\n${value}\r\n`,
      ),
    );
  }

  for (const file of files) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${multipartToken(file.field)}"; filename="${multipartToken(file.filename || "upload.bin")}"\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
      ),
    );
    chunks.push(Buffer.from(file.bytes || []));
    chunks.push(Buffer.from("\r\n"));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    body: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
};

const serializeBody = (body, headers) => {
  if (body === undefined || body === null) return undefined;
  if (body && body.__multipart) {
    const { body: payload, contentType } = buildMultipart(body);
    headers["Content-Type"] = contentType;
    return payload;
  }
  if (typeof body === "string" || body instanceof Uint8Array) {
    return body;
  }
  headers["Content-Type"] = headers["Content-Type"] || "application/json";
  return JSON.stringify(body);
};

const parseResponseData = (buffer, contentType) => {
  if (buffer.length === 0) return null;
  const text = buffer.toString("utf8");

  if ((contentType || "").includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
};

const request = async (options = {}) => {
  const {
    method = "GET",
    path,
    headers = {},
    body,
    responseType = "json",
    timeout = 10000,
  } = options;

  const normalizedMethod = String(method).toUpperCase();
  if (!ALLOWED_METHODS.has(normalizedMethod)) {
    return { ok: false, error: { message: "Method not allowed" } };
  }

  let url;
  try {
    url = resolveUrl(path);
  } catch (error) {
    return { ok: false, error: { message: error.message } };
  }

  const requestHeaders = attachOrigin(sanitizeHeaders(headers), config.API_ORIGIN);

  let payload;
  try {
    payload = serializeBody(body, requestHeaders);
  } catch (error) {
    return { ok: false, error: { message: error.message } };
  }

  if (payload && payload.byteLength > MAX_BODY_BYTES) {
    return { ok: false, error: { message: "Payload exceeds 250 MB limit" } };
  }

  const signal = timeout > 0 ? AbortSignal.timeout(timeout) : undefined;

  try {
    const response = await getApiSession().fetch(url, {
      method: normalizedMethod,
      headers: requestHeaders,
      body: payload,
      credentials: "include",
      signal,
      redirect: "follow",
    });

    const headersOut = {};
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie") headersOut[key.toLowerCase()] = value;
    });

    const raw = Buffer.from(await response.arrayBuffer());
    const content = headersOut["content-type"] || "";
    const data =
      responseType === "blob" ? new Uint8Array(raw) : parseResponseData(raw, content);

    if (!response.ok) {
      return {
        ok: false,
        error: {
          message:
            (data && (data.message || data.error)) ||
            `Request failed with status ${response.status}`,
          status: response.status,
          data,
          headers: headersOut,
        },
      };
    }

    return {
      ok: true,
      response: {
        status: response.status,
        headers: headersOut,
        data,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        message:
          error.name === "TimeoutError"
            ? "Request timed out"
            : error.message || "Network request failed",
      },
    };
  }
};

const logout = async () => {
  await getApiSession().clearStorageData({ storages: ["cookies", "localstorage"] });
  return true;
};

module.exports = { request, logout, buildMultipart, resolveUrl, sanitizeHeaders, attachOrigin };
