import sanitizeHtml from "sanitize-html";

export function sanitizeHtmlContent(html) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags,
    allowedAttributes: false,
  });
}
