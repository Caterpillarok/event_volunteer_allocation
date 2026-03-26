import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function Apply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, applyToEvent, showToast } = useApp();

  const event = useMemo(
    () => events.find((ev) => String(ev.id) === String(id)),
    [events, id]
  );
  const isOpen = (event?.status || "open") === "open";

  const [form, setForm] = useState({
    phone: "",
    age: "",
    availability: "",
    experience: "",
    motivation: "",
    referenceName: "",
    referenceContact: "",
  });

  const updateField = (key) => (e) => {
    const value = e.target.value;
    if (key === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, [key]: digits }));
      return;
    }
    if (key === "referenceContact") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, [key]: digits }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event || !isOpen) return;
    if (form.phone.length !== 10) {
      showToast("Enter a valid 10-digit phone number");
      return;
    }
    if (!form.age) {
      showToast("Enter your age");
      return;
    }
    if (!form.availability || !form.motivation || !form.experience) {
      showToast("Please complete all required fields");
      return;
    }
    if (form.motivation.length > 1000) {
      showToast("Motivation is too long (max 1000 chars)");
      return;
    }
    if (form.referenceContact && form.referenceContact.length !== 10) {
      showToast("Reference contact must be 10 digits");
      return;
    }
    try {
      await applyToEvent(event.id, {
        phone: form.phone,
        age: Number(form.age),
        availability: form.availability,
        experience: form.experience,
        motivation: form.motivation,
        reference_name: form.referenceName,
        reference_contact: form.referenceContact,
      });
      showToast("Application submitted");
      navigate("/volunteer");
    } catch (err) {
      showToast(err.message);
    }
  };

  if (!event) {
    return (
      <div className="card p-8">
        <h2 className="section-title">Event not found</h2>
        <p className="mt-2 text-sm text-ink/70">
          The event you are trying to apply for is not available.
        </p>
        <button className="action-btn mt-6" onClick={() => navigate("/events")}>
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="card p-8">
        <div className="kicker">Volunteer Application</div>
        <h2 className="section-title mt-2">{event.name}</h2>
        <p className="mt-2 text-sm text-ink/70">
          {event.date} · {event.venue}
        </p>
        <p className="mt-4 text-sm text-ink/70">{event.tagline}</p>

        {!isOpen && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ink/70">
            This event is currently closed for new applications.
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              type="tel"
              placeholder="Phone number"
              value={form.phone}
              onChange={updateField("phone")}
              inputMode="numeric"
              pattern="[0-9]{10}"
              title="Enter a 10-digit phone number (e.g., 1234567890)"
              maxLength={10}
              required
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              type="number"
              min="16"
              max="120"
              placeholder="Age"
              value={form.age}
              onChange={updateField("age")}
              required
            />
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              value={form.availability}
              onChange={updateField("availability")}
              required
            >
              <option value="">Preferred availability</option>
              <option>Weekdays</option>
              <option>Weekends</option>
              <option>Evenings</option>
            </select>
          </div>
          <select
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            value={form.experience}
            onChange={updateField("experience")}
            required
          >
            <option value="">Experience level</option>
            <option value="none">Nil</option>
            <option value="1 year">1 year</option>
            <option value="2 years">2 years</option>
            <option value="3+ years">3+ years</option>
          </select>
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            placeholder="Why do you want to volunteer?"
            value={form.motivation}
            onChange={updateField("motivation")}
            maxLength={1000}
            required
          />
          <div className="text-xs text-ink/60">
            {form.motivation.length}/1000
          </div>
          <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-ink/70">Reference (optional)</div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                type="text"
                placeholder="Reference name"
                value={form.referenceName}
                onChange={updateField("referenceName")}
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                type="text"
                placeholder="Reference contact"
                value={form.referenceContact}
                onChange={updateField("referenceContact")}
                inputMode="numeric"
                pattern="[0-9]{10}"
                title="Enter a 10-digit phone number (e.g., 1234567890)"
                maxLength={10}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="action-btn" type="submit" disabled={!isOpen}>
              Submit Application
            </button>
            <button
              className="ghost-btn"
              type="button"
              onClick={() => navigate("/events")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div className="card p-8">
        <div className="kicker">What to Expect</div>
        <h3 className="section-title mt-2">Shift overview</h3>
        <ul className="mt-4 space-y-3 text-sm text-ink/70">
          <li>Arrive 30 minutes before the event for briefing.</li>
          <li>Wear campus volunteer badge and comfortable shoes.</li>
          <li>Check in with the event lead for your assigned area.</li>
          <li>Log your hours in the volunteer dashboard after the event.</li>
        </ul>
      </div>
    </div>
  );
}
