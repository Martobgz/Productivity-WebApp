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

  const login = async (data) => {
    const res = await loginRequest(data);
    const token = res.data?.data?.session?.access_token;

    if (!token) {
      throw new Error("No access token returned. Please check your credentials.");
    }

    localStorage.setItem("token", token);
    localStorage.setItem("userEmail", data.email);
    setUser({ email: data.email });
  };

  const signup = async (data) => {
    const res = await signupRequest(data);
    const token = res.data?.data?.session?.access_token;

    if (!token) {
      throw new Error(
        "Registration succeeded but no session was created. Check if email confirmation is required."
      );
    }

    localStorage.setItem("token", token);
    localStorage.setItem("userEmail", data.email);
    setUser({ email: data.email });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
