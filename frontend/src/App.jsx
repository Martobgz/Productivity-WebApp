import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface-950)", color: "var(--color-text)" }}>
      {/* Top Nav */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface-900)" }}
      >
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="url(#navGrad)" />
            <path d="M10 18l5 5 11-11" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="navGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#818cf8" /><stop offset="1" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-base font-bold text-white tracking-tight">TaskFlow</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-1.5 rounded-lg font-medium transition-colors"
            style={{
              background: "var(--color-surface-700)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 65px)" }}>
        <div className="text-center px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: "var(--color-surface-700)", border: "1px solid var(--color-border)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Dashboard</h2>
          <p className="text-base" style={{ color: "var(--color-text-muted)", maxWidth: "360px" }}>
            Your workspaces and tasks will appear here. Full dashboard is coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
