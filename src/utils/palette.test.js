import test from "node:test";
import assert from "node:assert/strict";
import { pickList, filterCommands } from "./palette.js";

test("pickList unwraps every list shape the API has returned", () => {
  const rows = [{ id: 1 }];

  assert.deepEqual(pickList(rows, "vaults"), rows);
  assert.deepEqual(pickList({ vaults: rows }, "vaults"), rows);
  assert.deepEqual(pickList({ data: rows }, "vaults"), rows);
  assert.deepEqual(pickList({ data: { vaults: rows } }, "vaults"), rows);
});

test("pickList returns an empty list for missing or malformed payloads", () => {
  assert.deepEqual(pickList(undefined, "vaults"), []);
  assert.deepEqual(pickList(null, "vaults"), []);
  assert.deepEqual(pickList({ vaults: "nope" }, "vaults"), []);
  assert.deepEqual(pickList({ data: { message: "boom" } }, "vaults"), []);
});

test("filterCommands ranks prefix matches above substring matches", () => {
  const commands = [
    { label: "New Secret Note", detail: "", group: "Notes" },
    { label: "Secret Manager", detail: "", group: "Vault" },
    { label: "Secure Files", detail: "", group: "Vault" },
  ];

  assert.equal(filterCommands("secret", commands)[0].label, "Secret Manager");
  assert.equal(filterCommands("new", commands)[0].label, "New Secret Note");
});

test("filterCommands falls back to the detail field", () => {
  const commands = [
    { label: "Trash Bin", detail: "deleted items", group: "Vault" },
    { label: "Activity Logs", detail: "audit trail", group: "Vault" },
  ];

  assert.deepEqual(
    filterCommands("audit", commands).map((c) => c.label),
    ["Activity Logs"],
  );
});

test("filterCommands drops non-matches and caps the result count", () => {
  const commands = Array.from({ length: 20 }, (_, i) => ({
    label: i % 2 === 0 ? `item ${i}` : `other ${i}`,
    detail: "",
    group: "G",
  }));

  assert.equal(filterCommands("", commands, 5).length, 5);
  assert.deepEqual(
    filterCommands("zzz", commands).map((c) => c.label),
    [],
  );
});
