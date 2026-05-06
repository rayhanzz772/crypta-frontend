import DOMPurify from "dompurify";

export const sanitizeText = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
};

export const sanitizeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizeText(item))
    .filter((item) => typeof item === "string" && item.length > 0);
};
