import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { isDesktop } from "./utils/desktop";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import RecoverPassword from "./pages/RecoverPassword";
import Passwords from "./pages/Passwords";
import Notes from "./pages/Notes";
import ActivityLogs from "./pages/ActivityLogs";
import DeveloperKeys from "./pages/DeveloperKeys";
import ApiDocumentation from "./pages/ApiDocumentation";
import SecretManager from "./pages/SecretManager";
import SecureFiles from "./pages/SecureFiles";
import FolderDetail from "./pages/FolderDetail";
import Trash from "./pages/Trash";

function App() {
  // Density + radius tokens live on <html> so they apply above the router tree.
  useEffect(() => {
    document.documentElement.classList.toggle("desktop-shell", isDesktop);
    return () => document.documentElement.classList.remove("desktop-shell");
  }, []);

  return (
    <Router>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 1500,
              style: {
                background: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                padding: "14px 16px",
                boxShadow: "0 8px 24px -12px rgb(0 0 0 / 0.35)",
                fontSize: "14px",
              },
              success: {
                iconTheme: {
                  primary: "hsl(var(--success))",
                  secondary: "hsl(var(--popover))",
                },
              },
              error: {
                iconTheme: {
                  primary: "hsl(var(--destructive))",
                  secondary: "hsl(var(--popover))",
                },
              },
            }}
          />

          {/* Routes */}
          <Routes>
            {/* Public Routes */}
            {/* Desktop has no marketing site: boot straight into the vault shell. */}
            <Route path="/" element={isDesktop ? <Navigate to="/app" replace /> : <Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/recover-password" element={<RecoverPassword />} />

            {/* Protected Routes with App Layout */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Nested Routes */}
              <Route index element={<Passwords />} />
              <Route path="work" element={<Passwords />} />
              <Route path="finance" element={<Passwords />} />
              <Route path="social" element={<Passwords />} />
              <Route path="notes" element={<Notes />} />
              <Route path="logs" element={<ActivityLogs />} />
              <Route path="secret-manager" element={<SecretManager />} />
              <Route path="developer" element={<DeveloperKeys />} />
              <Route path="api-docs" element={<ApiDocumentation />} />
              <Route path="files" element={<SecureFiles />} />
              <Route path="files/folders/:folderId" element={<FolderDetail />} />
              <Route path="trash" element={<Trash />} />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        </TooltipProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
