import { createContext, useState, useEffect } from "react";
import { login as loginRequest, signup as signupRequest, updateProfile as updateProfileRequest } from "../api/auth";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Rehydrate user state from localStorage on page refresh
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");
    const displayName = localStorage.getItem("userDisplayName");
    const bio = localStorage.getItem("userBio");
    return token && email ? { email, displayName, bio } : null;
  });


  const normalizeEmail = (email) => (email ?? "").trim().toLowerCase();

  const login = async (data) => {
    const email = normalizeEmail(data?.email);
    // Clear previous user's cached workspaces before logging in
    localStorage.removeItem("notion_workspaces");
    const res = await loginRequest({ ...data, email });
    const { access_token: token, email: backendEmail, display_name: backendDisplayName, bio: backendBio } = res.data?.data?.session || {};

    if (!token) {
      throw new Error("No access token returned. Please check your credentials.");
    }

    const finalEmail = backendEmail || email;
    const finalDisplayName = backendDisplayName || finalEmail.split("@")[0];
    const finalBio = backendBio || "";

    localStorage.setItem("token", token);
    localStorage.setItem("userEmail", finalEmail);
    localStorage.setItem("userDisplayName", finalDisplayName);
    localStorage.setItem("userBio", finalBio);
    setUser({ email: finalEmail, displayName: finalDisplayName, bio: finalBio });
  };

  const signup = async (data) => {
    const email = normalizeEmail(data?.email);
    // Clear previous user's cached workspaces before signing up
    localStorage.removeItem("notion_workspaces");
    const res = await signupRequest({ ...data, email });
    const { access_token: token, email: backendEmail, display_name: backendDisplayName, bio: backendBio } = res.data?.data?.session || {};

    if (!token) {
      throw new Error(
        "Registration succeeded but no session was created. Check if email confirmation is required."
      );
    }

    const finalEmail = backendEmail || email;
    const finalDisplayName = backendDisplayName || data?.full_name?.trim() || finalEmail.split("@")[0];
    const finalBio = backendBio || "";

    localStorage.setItem("token", token);
    localStorage.setItem("userEmail", finalEmail);
    localStorage.setItem("userDisplayName", finalDisplayName);
    localStorage.setItem("userBio", finalBio);
    setUser({ email: finalEmail, displayName: finalDisplayName, bio: finalBio });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userDisplayName");
    localStorage.removeItem("userBio");
    localStorage.removeItem("notion_workspaces");
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await updateProfileRequest(data);
    const updatedUser = res.data;
    localStorage.setItem("userDisplayName", updatedUser.display_name);
    localStorage.setItem("userBio", updatedUser.bio || "");
    setUser((prev) => ({ ...prev, displayName: updatedUser.display_name, bio: updatedUser.bio }));
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
