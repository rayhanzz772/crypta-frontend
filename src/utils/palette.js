// Pure logic for the desktop command palette, kept out of the component so it can be tested.

// The vault/notes list endpoints have returned four different shapes over time
// (bare array, {vaults}, {data}, {data:{vaults}}) — see pages/Passwords.jsx.
export const pickList = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  return [];
};

const scoreMatch = (query, command) => {
  const label = (command.label || "").toLowerCase();
  const detail = (command.detail || "").toLowerCase();

  if (label.startsWith(query)) return 4;
  if (label.split(/\s+/).some((word) => word.startsWith(query))) return 3;
  if (label.includes(query)) return 2;
  if (detail.includes(query)) return 1;
  return 0;
};

export const filterCommands = (query, commands, limit = 8) => {
  const q = (query || "").trim().toLowerCase();
  const scored = commands
    .map((command) => ({ command, score: q ? scoreMatch(q, command) : 1 }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.command.group.localeCompare(b.command.group) ||
        a.command.label.localeCompare(b.command.label),
    );

  return limit > 0 ? scored.slice(0, limit).map(({ command }) => command) : scored.map(({ command }) => command);
};
