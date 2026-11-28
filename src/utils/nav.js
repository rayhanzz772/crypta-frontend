import {
  Activity,
  Briefcase,
  FileText,
  FolderKey,
  FolderLock,
  Gamepad2,
  LayoutGrid,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

// Lives outside a component file so both the web Sidebar and the desktop
// SidePanel/ActivityRail can import it without breaking react-refresh.
export const VAULT_CATEGORIES = [
  { name: "All Vault", icon: LayoutGrid, value: "", count: 0 },
  { name: "Work", icon: Briefcase, value: "Work", count: 0 },
  { name: "Gaming", icon: Gamepad2, value: "Game", count: 0 },
  { name: "Finance", icon: Wallet, value: "Finance", count: 0 },
  { name: "Social", icon: Users, value: "Social", count: 0 },
];

export const SECONDARY_LINKS = [
  { name: "Secret Notes", icon: FileText, path: "/app/notes" },
  { name: "Secure Files", icon: FolderLock, path: "/app/files" },
  { name: "Secret Manager", icon: FolderKey, path: "/app/secret-manager" },
  { name: "Activity Logs", icon: Activity, path: "/app/logs" },
  { name: "Trash Bin", icon: Trash2, path: "/app/trash" },
];
