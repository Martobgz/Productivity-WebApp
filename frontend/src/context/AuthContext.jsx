import { createContext, useContext, useState } from "react";
import { login as loginRequest, signup as signupRequest } from "../api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (data) => {
    const res = await loginRequest(data);
    const token = res.data.data.session.access_token;

    localStorage.setItem("token", token);
    setUser({ email: data.email });
  };

  const signup = async (data) => {
    const res = await signupRequest(data);
    const token = res.data.data.session.access_token;

    localStorage.setItem("token", token);
    setUser({ email: data.email });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
