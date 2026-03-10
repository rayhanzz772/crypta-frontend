import { ShieldX, LogOut, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

const BlockedVault = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <ShieldX className="w-5 h-5 text-red-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-white">
            Crypta
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      {/* Centered blocked message */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
            <ShieldX className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Vault Blocked
          </h1>

          {/* Description */}
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 sm:text-base leading-relaxed">
            Your vault has been blocked due to a security policy violation or an
            administrative action. All vault operations are disabled until the
            block is lifted.
          </p>

          {/* Info card */}
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-left dark:border-red-800/50 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-2">
              What does this mean?
            </p>
            <ul className="space-y-1.5 text-xs text-red-800 dark:text-red-300 sm:text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">•</span>
                <span>You cannot view, create, or modify any vault entries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">•</span>
                <span>Encrypted data remains safe but inaccessible</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">•</span>
                <span>Contact support to resolve this issue</span>
              </li>
            </ul>
          </div>

          {/* Account info */}
          {user?.email && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 sm:text-sm">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </div>
          )}

          {/* Sign out button */}
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-shadow hover:shadow-xl sm:text-base"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockedVault;
