import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-6 md:flex-row md:items-center">
        <div className="text-sm text-ink/70">
          Campus Volunteer Hub · Built for community impact
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="pill" to="/events">
            Browse Events
          </Link>
          <Link className="pill" to="/volunteer">
            Volunteer Signup
          </Link>
        </div>
      </div>
    </footer>
  );
}
