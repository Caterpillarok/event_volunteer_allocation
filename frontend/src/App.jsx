import React, { useEffect } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Toast from "./components/Toast.jsx";
import Home from "./pages/Home.jsx";
import Events from "./pages/Events.jsx";
import Volunteer from "./pages/Volunteer.jsx";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";
import Apply from "./pages/Apply.jsx";
import NotFound from "./pages/NotFound.jsx";
import { useApp } from "./context/AppContext.jsx";
import { initMagicAreas } from "./utils/magicArea.js";

function RequireAuth({ role, children }) {
  const { user, userLoading } = useApp();
  const location = useLocation();

  if (userLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink/60">
        Loading...
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/volunteer"} replace />;
  }

  return children;
}

export default function App() {
  const location = useLocation();
  const { events } = useApp();

  useEffect(() => {
    if (location.pathname === "/login" || location.pathname === "/admin") {
      return undefined;
    }
    const cleanup = initMagicAreas();
    return cleanup;
  }, [location.pathname, events.length]);

  return (
    <div className="relative min-h-screen bg-mist text-ink">
      <div className="grain" aria-hidden="true" />
      <div className="gradient-bg min-h-screen">
        {location.pathname !== "/login" && location.pathname !== "/admin" && (
          <>
            <div
              className="magic-area magic-area--menu"
              data-target-class=".js-magic-nav"
              data-tween-back="true"
              aria-hidden="true"
            />
            <div
              className="magic-area magic-area--content"
              data-target-class=".js-magic-card"
              data-tween-back="false"
              aria-hidden="true"
            />
          </>
        )}
        <Header />
        <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route
              path="/volunteer"
              element={
                <RequireAuth>
                  <Volunteer />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth role="admin">
                  <Admin />
                </RequireAuth>
              }
            />
            <Route
              path="/apply/:id"
              element={
                <RequireAuth role="volunteer">
                  <Apply />
                </RequireAuth>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toast />
    </div>
  );
}
