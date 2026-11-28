const PLACEHOLDERS = [
  ["/notes", "Search notes by title, content, or tags..."],
  ["/secret-manager", "Search projects and secrets..."],
  ["/files", "Search folder / file..."],
  ["/trash", "Search trash items..."],
];

// Shared by the web Topbar and the desktop SidePanel so the two search fields agree.
export const getSearchPlaceholder = (pathname = "") =>
  PLACEHOLDERS.find(([segment]) => pathname.includes(segment))?.[1] || "Search passwords...";
