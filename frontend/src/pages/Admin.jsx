import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";

export default function Admin() {
  const {
    events,
    volunteers,
    createEvent,
    updateEvent,
    deleteEvent,
    seedSample,
    showToast,
    applications,
    updateApplicationStatus,
  } = useApp();
  const [form, setForm] = useState({
    name: "",
    date: "",
    venue: "",
    category: "",
    slots: "",
    tagline: "",
    status: "open",
  });
  const [editingId, setEditingId] = useState(null);
  const [expandedAppId, setExpandedAppId] = useState(null);

  const updateField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        slots: Number(form.slots),
      };
      if (editingId) {
        await updateEvent(editingId, payload);
        showToast("Event updated");
      } else {
        await createEvent(payload);
        showToast("Event added");
      }
      setForm({
        name: "",
        date: "",
        venue: "",
        category: "",
        slots: "",
        tagline: "",
        status: "open",
      });
      setEditingId(null);
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setForm({
      name: event.name || "",
      date: event.date || "",
      venue: event.venue || "",
      category: event.category || "",
      slots: event.slots ?? "",
      tagline: event.tagline || "",
      status: event.status || "open",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      name: "",
      date: "",
      venue: "",
      category: "",
      slots: "",
      tagline: "",
      status: "open",
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteEvent(id);
      showToast("Event removed");
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleToggleStatus = async (event) => {
    try {
      const next = event.status === "closed" ? "open" : "closed";
      await updateEvent(event.id, { status: next });
      showToast(`Event ${next}`);
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleReview = async (appId, status) => {
    try {
      await updateApplicationStatus(appId, status);
      showToast(`Marked ${status}`);
    } catch (err) {
      showToast(err.message);
    }
  };

  const toggleAppDetails = (appId) => {
    setExpandedAppId((prev) => (prev === appId ? null : appId));
  };

  const rejectedVolunteerIds = new Set(
    applications
      .filter((app) => app.status === "rejected")
      .map((app) => app.user_id)
  );

  const handleSeed = async () => {
    try {
      await seedSample();
      showToast("Sample data loaded");
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="kicker">Admin Console</div>
          <h2 className="section-title mt-2">Create new events</h2>
          <p className="text-sm text-ink/70">
            Manage events and monitor volunteer participation.
          </p>
        </div>
        <button className="ghost-btn" type="button" onClick={handleSeed}>
          Load Sample Data
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="card p-8">
          <div className="text-sm font-semibold text-ink/70">Create Event</div>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                type="text"
                placeholder="Event Name"
                value={form.name}
                onChange={updateField("name")}
                required
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                type="date"
                value={form.date}
                onChange={updateField("date")}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                type="text"
                placeholder="Venue"
                value={form.venue}
                onChange={updateField("venue")}
                required
              />
              <select
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                value={form.category}
                onChange={updateField("category")}
                required
              >
                <option value="">Category</option>
                <option value="community">Community</option>
                <option value="arts">Arts</option>
                <option value="sports">Sports</option>
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                type="number"
                min="1"
                placeholder="Slots"
                value={form.slots}
                onChange={updateField("slots")}
                required
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                type="text"
                placeholder="Short Tagline"
                value={form.tagline}
                onChange={updateField("tagline")}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <select
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                value={form.status}
                onChange={updateField("status")}
                required
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="action-btn" type="submit">
                {editingId ? "Save Changes" : "Add Event"}
              </button>
              {editingId && (
                <button className="ghost-btn" type="button" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="table-shell">
            <div className="border-b border-ink/10 px-6 py-4 text-sm font-semibold text-ink/70">
              Application Review
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink/5 text-xs uppercase tracking-[0.2em] text-ink/50">
                  <tr>
                    <th className="px-6 py-3">Volunteer</th>
                    <th className="px-6 py-3">Event</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length ? (
                    applications
                      .filter((app) => app.status !== "rejected")
                      .map((app) => (
                      <React.Fragment key={app.id}>
                        <tr className="border-t border-ink/5">
                          <td className="px-6 py-3">
                            <div className="text-sm font-semibold text-ink">
                              {app.user_name || "Volunteer"}
                            </div>
                            <div className="text-xs text-ink/60">{app.user_email}</div>
                          </td>
                          <td className="px-6 py-3">{app.event_name}</td>
                          <td className="px-6 py-3">
                            <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70">
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70"
                                type="button"
                                onClick={() => toggleAppDetails(app.id)}
                              >
                                {expandedAppId === app.id ? "Hide" : "View"}
                              </button>
                              <button
                                className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70"
                                type="button"
                                onClick={() => handleReview(app.id, "approved")}
                              >
                                Approve
                              </button>
                              <button
                                className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70"
                                type="button"
                                onClick={() => handleReview(app.id, "shortlisted")}
                              >
                                Shortlist
                              </button>
                              <button
                                className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70"
                                type="button"
                                onClick={() => handleReview(app.id, "rejected")}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedAppId === app.id && (
                          <tr className="border-t border-ink/5 bg-white/5">
                            <td className="px-6 py-4 text-sm text-ink/80" colSpan={4}>
                              <div className="grid gap-2">
                                <div><strong>Phone:</strong> {app.phone || "--"}</div>
                                <div><strong>Age:</strong> {app.age ?? "--"}</div>
                                <div><strong>Availability:</strong> {app.availability || "--"}</div>
                                <div>
                                  <strong>Experience:</strong>{" "}
                                  {app.experience === "none" ? "Nil" : app.experience || "--"}
                                </div>
                                <div><strong>Motivation:</strong> {app.motivation || "--"}</div>
                                <div><strong>Reference:</strong> {app.reference_name || "--"}</div>
                                <div><strong>Reference Contact:</strong> {app.reference_contact || "--"}</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr className="border-t border-ink/5">
                      <td className="px-6 py-4 text-sm text-ink/60" colSpan={4}>
                        No applications yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-shell">
            <div className="border-b border-ink/10 px-6 py-4 text-sm font-semibold text-ink/70">
              Event Roster
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink/5 text-xs uppercase tracking-[0.2em] text-ink/50">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Slots</th>
                    <th className="px-6 py-3">Applicants</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-t border-ink/5">
                      <td className="px-6 py-3">{event.name}</td>
                      <td className="px-6 py-3">{event.date}</td>
                      <td className="px-6 py-3">{event.category}</td>
                      <td className="px-6 py-3">{event.slots}</td>
                      <td className="px-6 py-3">{event.applicants || 0}</td>
                      <td className="px-6 py-3">
                        <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70">
                          {event.status || "open"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70"
                            type="button"
                            onClick={() => handleEdit(event)}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70"
                            type="button"
                            onClick={() => handleToggleStatus(event)}
                          >
                            {event.status === "closed" ? "Reopen" : "Close"}
                          </button>
                          <button
                            className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70"
                            type="button"
                            onClick={() => handleDelete(event.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-shell">
            <div className="border-b border-ink/10 px-6 py-4 text-sm font-semibold text-ink/70">
              Volunteer Roster
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink/5 text-xs uppercase tracking-[0.2em] text-ink/50">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Skill</th>
                    <th className="px-6 py-3">Availability</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((vol) => (
                    <tr key={vol.id} className="border-t border-ink/5">
                      <td className="px-6 py-3">{vol.name}</td>
                      <td className="px-6 py-3">{vol.skill || ""}</td>
                      <td className="px-6 py-3">{vol.availability || ""}</td>
                      <td className="px-6 py-3">
                        {rejectedVolunteerIds.has(vol.user_id) ? (
                          <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70">
                            Rejected
                          </span>
                        ) : (
                          <span className="text-xs text-ink/50">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-ink/70">
                          Profile
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
