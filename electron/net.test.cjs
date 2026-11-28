const test = require("node:test");
const assert = require("node:assert/strict");
const { buildMultipart, resolveUrl, sanitizeHeaders, attachOrigin } = require("./net.cjs");

test("buildMultipart includes fields and file bytes", () => {
  const { body, contentType } = buildMultipart({
    fields: { folder_id: "7" },
    files: [
      {
        field: "file",
        filename: "pass words.txt",
        type: "text/plain",
        bytes: new Uint8Array([104, 105]),
      },
    ],
  });

  const boundary = contentType.split("boundary=")[1];
  const text = body.toString("utf8");

  assert.ok(boundary);
  assert.match(text, /name="folder_id"\r\n\r\n7/);
  assert.match(text, /filename="pass words.txt"/);
  assert.match(text, /hi/);
  assert.ok(text.endsWith(`--${boundary}--\r\n`));
});

test("buildMultipart strips header-injection characters", () => {
  const { body } = buildMultipart({
    files: [
      {
        field: 'file"\r\nX-Evil: 1',
        filename: 'a"\r\nb',
        bytes: new Uint8Array(),
      },
    ],
  });

  const text = body.toString("utf8");
  assert.ok(!text.includes("\r\nX-Evil: 1"));
  assert.ok(!text.includes('a"\r\nb'));
});

test("resolveUrl rejects absolute and protocol-relative paths", () => {
  assert.throws(() => resolveUrl("https://evil.test/x"));
  assert.throws(() => resolveUrl("//evil.test/x"));
  assert.match(resolveUrl("/api/vault?page=1"), /\/api\/vault\?page=1$/);
});

test("sanitizeHeaders drops transport-controlled headers", () => {
  const headers = sanitizeHeaders({
    Host: "evil.test",
    Cookie: "a=b",
    Origin: "https://evil.test",
    "Content-Type": "application/json",
  });

  assert.deepEqual(headers, { "Content-Type": "application/json" });
});

test("attachOrigin supplies the transport origin the CSRF guard requires", () => {
  assert.deepEqual(attachOrigin({}, "http://localhost:5000"), {
    Origin: "http://localhost:5000",
  });
});

test("attachOrigin is the only writer: sanitized headers cannot carry one", () => {
  const headers = attachOrigin(sanitizeHeaders({ origin: "https://evil.test" }), "http://localhost:5000");

  assert.deepEqual(headers, { Origin: "http://localhost:5000" });
});
