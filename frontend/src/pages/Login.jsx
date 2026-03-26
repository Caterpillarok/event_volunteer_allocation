import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function Login() {
  const { login, register, showToast } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    skill: "",
    availability: "",
  });

  const redirect = searchParams.get("redirect") || "/volunteer";

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await login(loginData);
      showToast("Logged in");
      if (user?.role === "admin") navigate("/admin");
      else navigate(redirect);
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register(registerData);
      showToast("Account created");
      navigate("/volunteer");
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card p-8">
        <div className="kicker">Secure Access</div>
        <h2 className="section-title mt-2">Login</h2>
        <p className="mt-2 text-sm text-ink/70">
          Use your campus account to access volunteer or admin tools.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              type="email"
              placeholder="Email"
              value={loginData.email}
              onChange={(e) =>
                setLoginData((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData((prev) => ({ ...prev, password: e.target.value }))
              }
              required
            />
          </div>
          <button className="action-btn" type="submit">
            Sign In
          </button>
        </form>
      </div>

      <div className="card p-8">
        <div className="kicker">New Here?</div>
        <h2 className="section-title mt-2">Create Account</h2>
        <p className="mt-2 text-sm text-ink/70">
          Register as a volunteer. Admin accounts are created by staff.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleRegister}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              type="text"
              placeholder="Full Name"
              value={registerData.name}
              onChange={(e) =>
                setRegisterData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              type="email"
              placeholder="Email"
              value={registerData.email}
              onChange={(e) =>
                setRegisterData((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              type="password"
              placeholder="Password"
              value={registerData.password}
              onChange={(e) =>
                setRegisterData((prev) => ({ ...prev, password: e.target.value }))
              }
              required
            />
            <input
              className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-sm text-ink/60"
              type="text"
              placeholder="Volunteer"
              value="Volunteer"
              disabled
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              type="text"
              placeholder="Skill (optional)"
              value={registerData.skill}
              onChange={(e) =>
                setRegisterData((prev) => ({ ...prev, skill: e.target.value }))
              }
            />
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              value={registerData.availability}
              onChange={(e) =>
                setRegisterData((prev) => ({ ...prev, availability: e.target.value }))
              }
            >
              <option value="">Availability (optional)</option>
              <option>Weekdays</option>
              <option>Weekends</option>
              <option>Evenings</option>
            </select>
          </div>
          <button className="action-btn" type="submit">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
