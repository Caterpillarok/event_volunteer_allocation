import React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

const navLinkClass = ({ isActive }) =>
  [
    "js-magic-nav relative z-20 rounded-full px-3 py-2 transition",
    isActive
      ? "is-magic-active text-ink"
      : "text-ink/80 hover:text-ink",
  ].join(" ");

export default function Header() {
  const { user, logout, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    showToast("Logged out");
    navigate("/login");
  };

  return (
    <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-5">
        <Link to="/" className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-2xl bg-gradient-to-br from-white to-white shadow-lg shadow-black/30" />
          <div>
            <div className="text-lg font-display">Campus Volunteer Hub</div>
            <div className="text-xs uppercase tracking-[0.3em] text-ink/60">
              Events · Impact · Community
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/events" className={navLinkClass}>
            Events
          </NavLink>
          {user?.role === "volunteer" && (
            <NavLink to="/volunteer" className={navLinkClass}>
              Volunteer
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {location.pathname === "/login" && (
            <NavLink className="ghost-btn" to="/events">
              Events
            </NavLink>
          )}
          {user ? (
            <button className="ghost-btn" type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <NavLink className="ghost-btn" to="/login">
              Login
            </NavLink>
          )}
        </div>
      </div>

      <nav className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 pb-4 text-sm font-medium md:hidden">
        <NavLink to="/" className={navLinkClass}>
          Home
        </NavLink>
        <NavLink to="/events" className={navLinkClass}>
          Events
        </NavLink>
        {user?.role === "volunteer" && (
          <NavLink to="/volunteer" className={navLinkClass}>
            Volunteer
          </NavLink>
        )}
        {user?.role === "admin" && (
          <NavLink to="/admin" className={navLinkClass}>
            Admin
          </NavLink>
        )}
      </nav>
    </header>
  );
}
