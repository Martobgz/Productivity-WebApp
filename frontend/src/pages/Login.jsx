import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="bg-zinc-900 p-8 rounded-2xl shadow-xl w-96">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Welcome Back
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button className="w-full bg-indigo-600 hover:bg-indigo-700 p-3 rounded-lg transition">
            Login
          </button>
        </form>

        <p className="text-sm mt-4 text-center text-zinc-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
