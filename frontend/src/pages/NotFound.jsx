import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="kicker">404</div>
      <h2 className="section-title">Page not found</h2>
      <p className="text-sm text-ink/70">
        The page you are looking for does not exist.
      </p>
      <Link className="action-btn" to="/">
        Go Home
      </Link>
    </div>
  );
}
