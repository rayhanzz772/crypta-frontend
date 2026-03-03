import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RecoverPassword from "./pages/RecoverPassword";
import Passwords from "./pages/Passwords";
import Notes from "./pages/Notes";
import ActivityLogs from "./pages/ActivityLogs";
import DeveloperKeys from "./pages/DeveloperKeys";
import ApiDocumentation from "./pages/ApiDocumentation";
import SecretManager from "./pages/SecretManager";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen">
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 1500,
              style: {
                background: "var(--toast-bg)",
                color: "var(--toast-color)",
                borderRadius: "12px",
                padding: "16px",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />

          {/* Routes */}
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
