import { createContext, useState } from "react";
import { login as loginRequest, signup as signupRequest } from "../api/auth";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Rehydrate user state from localStorage on page refresh
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");
    return token && email ? { email } : null;
  });

  const normalizeEmail = (email) => (email ?? "").trim().toLowerCase();

  const login = async (data) => {
    const email = normalizeEmail(data?.email);
    // Clear previous user's cached workspaces before logging in
    localStorage.removeItem("notion_workspaces");
    const res = await loginRequest({ ...data, email });
    const token = res.data?.data?.session?.access_token;

    if (!token) {
      throw new Error("No access token returned. Please check your credentials.");
    }

    // Derive a simple display name from the email (before we persist full names)
    const displayName = email ? email.split("@")[0] : "";

    localStorage.setItem("token", token);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userDisplayName", displayName);
    setUser({ email, displayName });
  };

  const signup = async (data) => {
    const email = normalizeEmail(data?.email);
    // Clear previous user's cached workspaces before signing up
    localStorage.removeItem("notion_workspaces");
    const res = await signupRequest({ ...data, email });
    const token = res.data?.data?.session?.access_token;

    if (!token) {
      throw new Error(
        "Registration succeeded but no session was created. Check if email confirmation is required."
      );
    }

    const displayName =
      data?.full_name?.trim() ||
      (email ? email.split("@")[0] : "");

    localStorage.setItem("token", token);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userDisplayName", displayName);
    setUser({ email, displayName });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("notion_workspaces");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
