import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import EventCard from "../components/EventCard.jsx";

export default function Home() {
  const { events, volunteers } = useApp();
  const featured = events.slice(0, 3);

  return (
    <div className="space-y-16">
      <section className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="kicker">Campus Event Volunteering</div>
          <h1 className="text-4xl font-display leading-tight md:text-5xl">
            Turn student energy into real campus impact.
          </h1>
          <p className="max-w-xl text-base text-ink/70">
            Discover events that need hands, sign up in seconds, and help teams
            deliver unforgettable experiences across campus.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link className="action-btn" to="/events">
              Browse Events
            </Link>
            <Link className="ghost-btn" to="/admin">
              Admin Console
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-ink/60">
                Active Events
              </div>
              <div className="text-2xl font-display">{events.length}</div>
            </div>
            <div className="glass p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-ink/60">
                Volunteers
              </div>
              <div className="text-2xl font-display">
                {volunteers.length || "--"}
              </div>
            </div>
            <div className="glass p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-ink/60">
                Impact Hours
              </div>
              <div className="text-2xl font-display">
                {(volunteers.length || 0) * 4}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-ink/70">This Week</div>
                <div className="text-2xl font-display">Momentum</div>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                +18%
              </span>
            </div>
            <div className="mt-6 h-28 rounded-2xl bg-gradient-to-r from-white/20 via-teal/5 to-white/10" />
            <div className="mt-4 text-sm text-ink/60">
              Volunteer signups are trending up for Spring events.
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold text-ink/70">Top Needs</div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center justify-between rounded-xl bg-ink/5 px-4 py-3">
                <span>Stage setup & logistics</span>
                <span className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  Setup
                </span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-ink/5 px-4 py-3">
                <span>Guides for welcome tours</span>
                <span className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  Guide
                </span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-ink/5 px-4 py-3">
                <span>Photo + recap crew</span>
                <span className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  Media
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">Featured Events</h2>
            <p className="text-sm text-ink/70">
              Highlights from upcoming campus moments.
            </p>
          </div>
          <Link className="pill" to="/events">
            View All
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featured.length ? (
            featured.map((event) => (
              <EventCard key={event.id} event={event} isVolunteer={false} />
            ))
          ) : (
            <div className="card p-6">No events yet. Check back soon.</div>
          )}
        </div>
      </section>
    </div>
  );
}
