import React, { useMemo, useState } from "react";
import EventCard from "../components/EventCard.jsx";
import { useApp } from "../context/AppContext.jsx";

const filters = ["all", "community", "arts", "sports"];

export default function Events() {
  const { events, user } = useApp();
  const [active, setActive] = useState("all");

  const filtered = useMemo(() => {
    if (active === "all") return events;
    return events.filter((event) => event.category === active);
  }, [events, active]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="section-title">Upcoming Events</h2>
          <p className="text-sm text-ink/70">
            Find the right event and reserve your shift.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActive(filter)}
              className={
                active === filter
                  ? "pill border-ink/30 bg-ink text-mist"
                  : "pill"
              }
            >
              {filter === "all" ? "All" : filter[0].toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {filtered.length ? (
          filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isVolunteer={user?.role === "volunteer"}
            />
          ))
        ) : (
          <div className="card p-6">No events in this category yet.</div>
        )}
      </div>
    </div>
  );
}
