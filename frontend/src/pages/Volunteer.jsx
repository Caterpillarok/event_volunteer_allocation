import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import EventCard from "../components/EventCard.jsx";

export default function Volunteer() {
  const { user, events, applications, updateProfile, cancelApplication, showToast } = useApp();
  const [skill, setSkill] = useState("");
  const [availability, setAvailability] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ skill, availability });
      showToast("Profile updated");
    } catch (err) {
      showToast(err.message);
    }
  };

  const isVolunteer = user?.role === "volunteer";

  const handleCancel = async (appId) => {
    try {
      await cancelApplication(appId);
      showToast("Application cancelled");
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-8">
          <div className="kicker">Volunteer Profile</div>
          <h2 className="section-title mt-2">Your campus availability</h2>
          <p className="mt-2 text-sm text-ink/70">
            Update your profile so we can match you with the right events.
          </p>
          {isVolunteer ? (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  type="text"
                  value={user?.name || ""}
                  readOnly
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  type="email"
                  value={user?.email || ""}
                  readOnly
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  type="text"
                  placeholder="Skill (e.g., Logistics)"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  required
                />
                <select
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  required
                >
                  <option value="">Availability</option>
                  <option>Weekdays</option>
                  <option>Weekends</option>
                  <option>Evenings</option>
                </select>
              </div>
              <button className="action-btn" type="submit">
                Save Profile
              </button>
            </form>
          ) : (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ink/60">
              Admin accounts do not have volunteer profiles.
            </div>
          )}
        </div>

        <div className="card p-8">
          <div className="kicker">My Applications</div>
          <h2 className="section-title mt-2">Track your shifts</h2>
          <div className="mt-6 space-y-3">
            {applications.length ? (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      {app.event_name}
                    </div>
                    <div className="text-xs text-ink/60">{app.status}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCancel(app.id)}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-ink/70 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ink/60">
                {isVolunteer ? "No applications yet." : "Volunteer applications appear here."}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-title">Available Events</h2>
          <p className="text-sm text-ink/70">Pick a shift and apply instantly.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {events.length ? (
            events.map((event) => (
              <EventCard key={event.id} event={event} isVolunteer={isVolunteer} />
            ))
          ) : (
            <div className="card p-6">No events yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
