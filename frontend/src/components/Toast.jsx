import React from "react";
import { useApp } from "../context/AppContext.jsx";

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-ink shadow-lg backdrop-blur">
      {toast}
    </div>
  );
}
