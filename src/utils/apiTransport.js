import axios from "axios";

let responseErrorHandler = null;

export const setResponseErrorHandler = (handler) => {
  responseErrorHandler = handler;
};

const notifyError = (error) => {
  try {
    responseErrorHandler?.(error);
  } catch {
    // Error handlers must never break the request flow.
  }
};

const toTransportError = (payload) => {
  const error = new Error(payload?.message || "Request failed");

  if (payload?.status) {
    error.response = {
      status: payload.status,
      data: payload.data,
      headers: payload.headers || {},
    };
  } else {
    error.request = {};
  }

  return error;
};

const formDataToPayload = async (formData) => {
  const fields = {};
  const files = [];

  for (const [name, value] of formData.entries()) {
    if (typeof value === "string") {
      fields[name] = value;
      continue;
    }

    if (value instanceof Blob) {
      files.push({
        field: name,
        filename: value.name || "upload.bin",
        type: value.type || "application/octet-stream",
        bytes: new Uint8Array(await value.arrayBuffer()),
      });
    }
  }

  return { __multipart: true, fields, files };
};

const createIpcClient = (defaults) => {
  const send = async (method, url, data, config = {}) => {
    const body = data instanceof FormData ? await formDataToPayload(data) : data;
    const responseType = config.responseType === "blob" ? "blob" : "json";

    const result = await window.cryptaDesktop.request({
      method,
      path: url,
      headers: config.headers || {},
      body,
      responseType,
      timeout: config.timeout ?? defaults.timeout,
    });

    if (!result.ok) {
      const error = toTransportError(result.error);
      notifyError(error);
      throw error;
    }

    let responseData = result.response.data;

    if (responseType === "blob") {
      responseData = new Blob([responseData], {
        type: result.response.headers["content-type"] || "application/octet-stream",
      });
    }

    return {
      data: responseData,
      status: result.response.status,
      headers: result.response.headers,
      config,
    };
  };

  return {
    get: (url, config) => send("GET", url, undefined, config),
    delete: (url, config) => send("DELETE", url, undefined, config),
    post: (url, data, config) => send("POST", url, data, config),
    put: (url, data, config) => send("PUT", url, data, config),
    patch: (url, data, config) => send("PATCH", url, data, config),
  };
};

const createAxiosClient = (defaults) => {
  const instance = axios.create({
    baseURL: defaults.baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
    timeout: defaults.timeout,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      notifyError(error);
      return Promise.reject(error);
    },
  );

  return instance;
};

export const createClient = (defaults) =>
  typeof window !== "undefined" && window.cryptaDesktop?.request
    ? createIpcClient(defaults)
    : createAxiosClient(defaults);
