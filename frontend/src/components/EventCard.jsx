import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function EventCard({ event, isVolunteer }) {
  const { showToast } = useApp();
  const slotsLeft =
    event.slots_left ?? Math.max(0, event.slots - (event.applicants || 0));
  const isOpen = (event.status || "open") === "open";
  const canApply = isVolunteer && isOpen && slotsLeft > 0 && !event.applied;

  const handleBlocked = () => {
    if (event.applied) showToast("You already applied");
    else if (!isOpen) showToast("Event closed");
    else showToast("No slots left");
  };

  return (
    <div
      className="card js-magic-card relative z-10 flex h-full flex-col gap-4 p-6"
      tabIndex={0}
      role="group"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">
          {event.category || "general"}
        </span>
        <span className="text-xs text-ink/60">
          {isOpen ? `Slots left: ${slotsLeft}` : "Closed"}
        </span>
      </div>
      <div>
        <h3 className="text-xl font-display text-ink">{event.name}</h3>
        <div className="text-sm text-ink/70">
          {event.date} · {event.venue}
        </div>
      </div>
      <p className="text-sm text-ink/80">{event.tagline}</p>
      <div className="mt-auto">
        {isVolunteer ? (
          canApply ? (
            <Link
              to={`/apply/${event.id}`}
              className="block w-full rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-black shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
            >
              Apply
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBlocked}
              className="w-full cursor-not-allowed rounded-xl bg-ink/10 px-4 py-2 text-sm font-semibold text-ink/50"
            >
              {event.applied ? "Applied" : isOpen ? "Full" : "Closed"}
            </button>
          )
        ) : (
          <button
            type="button"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-ink/70"
          >
            Details
          </button>
        )}
      </div>
    </div>
  );
}
