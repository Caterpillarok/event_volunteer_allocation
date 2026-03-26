const App = {
  user: null,
  events: [],
  volunteers: [],
  applications: [],
  editingEventId: null,
  expandedAppId: null,

  async init() {
    await this.fetchMe();
    this.bindAuth();
    this.bindForms();
    this.bindFilters();
    await this.loadData();
    this.guardProtected();
    this.renderAll();
    this.initSparkline();
  },

  async api(path, options = {}) {
    const res = await fetch(`/api${path}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "Request failed");
    }
    return res.json();
  },

  async fetchMe() {
    try {
      this.user = await this.api("/me");
    } catch {
      this.user = null;
    }
  },

  async loadData() {
    await this.loadEvents();
    if (this.user?.role === "admin") {
      await this.loadVolunteers();
      await this.loadAllApplications();
    }
    if (this.user?.role === "volunteer") {
      await this.loadApplications();
    }
  },

  async loadEvents() {
    try {
      this.events = await this.api("/events");
    } catch {
      this.events = [];
    }
  },

  async loadVolunteers() {
    try {
      this.volunteers = await this.api("/volunteers");
    } catch {
      this.volunteers = [];
    }
  },

  async loadApplications() {
    try {
      this.applications = await this.api("/applications");
    } catch {
      this.applications = [];
    }
  },

  async loadAllApplications() {
    try {
      this.applications = await this.api("/applications/all");
    } catch {
      this.applications = [];
    }
  },

  bindAuth() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        try {
          await this.api("/login", {
            method: "POST",
            body: JSON.stringify({
              email: loginEmail.value,
              password: loginPass.value,
            }),
          });
          await this.fetchMe();
          this.toast("Logged in");
          const redirect = this.getRedirectTarget();
          if (redirect) window.location.href = redirect;
          else if (this.user?.role === "admin") window.location.href = "admin.html";
          else window.location.href = "volunteer.html";
        } catch (err) {
          this.toast(err.message);
        }
      };
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      registerForm.onsubmit = async (e) => {
        e.preventDefault();
        try {
          await this.api("/register", {
            method: "POST",
            body: JSON.stringify({
              name: regName.value,
              email: regEmail.value,
              password: regPass.value,
              skill: regSkill?.value || "",
              availability: regAvailability?.value || "",
            }),
          });
          await this.fetchMe();
          this.toast("Account created");
          if (this.user?.role === "admin") window.location.href = "admin.html";
          else window.location.href = "volunteer.html";
        } catch (err) {
          this.toast(err.message);
        }
      };
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await this.api("/logout", { method: "POST" });
        } catch {
          // ignore
        }
        this.user = null;
        this.updateAuthUI();
        this.toast("Logged out");
        if (this.isAdminPage() || this.isVolunteerPage()) {
          window.location.href = "login.html";
        }
      });
    }

    this.updateAuthUI();
  },

  updateAuthUI() {
    const adminLinks = document.querySelectorAll(".admin-link");
    const loginLink = document.getElementById("loginLink");
    const logoutBtn = document.getElementById("logoutBtn");

    adminLinks.forEach((link) => {
      link.style.display = this.user?.role === "admin" ? "inline-flex" : "none";
    });
    if (loginLink) loginLink.style.display = this.user ? "none" : "inline-flex";
    if (logoutBtn) logoutBtn.style.display = this.user ? "inline-flex" : "none";
  },

  isAdminPage() {
    return window.location.pathname.endsWith("admin.html");
  },

  isVolunteerPage() {
    return window.location.pathname.endsWith("volunteer.html");
  },

  guardProtected() {
    if (!this.isAdminPage() && !this.isVolunteerPage()) return;
    if (!this.user) {
      const target = this.isAdminPage() ? "admin.html" : "volunteer.html";
      window.location.href = `login.html?redirect=${encodeURIComponent(target)}`;
      return;
    }
    if (this.isAdminPage() && this.user.role !== "admin") {
      window.location.href = "volunteer.html";
    }
  },

  getRedirectTarget() {
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect");
  },

  bindForms() {
    const eventForm = document.getElementById("eventForm");
    if (eventForm) {
      eventForm.onsubmit = async (e) => {
        e.preventDefault();
        try {
          const payload = {
            name: eventName.value,
            date: eventDate.value,
            venue: eventVenue.value,
            category: eventCategory.value,
            slots: eventSlots.value,
            tagline: eventTagline.value,
            status: eventStatus.value,
          };

          if (this.editingEventId) {
            await this.api(`/events/${this.editingEventId}`, {
              method: "PUT",
              body: JSON.stringify(payload),
            });
          } else {
            await this.api("/events", {
              method: "POST",
              body: JSON.stringify(payload),
            });
          }
          await this.loadEvents();
          this.renderAll();
          this.resetEventForm();
          this.toast(this.editingEventId ? "Event updated" : "Event Added");
        } catch (err) {
          this.toast(err.message);
        }
      };
    }

    const eventCancelBtn = document.getElementById("eventCancelBtn");
    if (eventCancelBtn) {
      eventCancelBtn.addEventListener("click", () => this.resetEventForm());
    }

    const volForm = document.getElementById("volForm");
    if (volForm) {
      volForm.onsubmit = async (e) => {
        e.preventDefault();
        if (!this.user) {
          window.location.href = "login.html?redirect=volunteer.html";
          return;
        }
        try {
          await this.api("/volunteers/me", {
            method: "PUT",
            body: JSON.stringify({
              skill: volSkill.value,
              availability: volAvailability.value,
            }),
          });
          this.toast("Profile updated");
        } catch (err) {
          this.toast(err.message);
        }
      };
    }

    const applyForm = document.getElementById("applyForm");
    if (applyForm) {
      applyForm.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
          eventId: applyForm.dataset.eventId,
          phone: applyPhone.value.trim(),
          age: applyAge.value.trim(),
          availability: applyAvailability.value,
          experience: applyExperience.value,
          motivation: applyMotivation.value.trim(),
          referenceName: applyRefName.value.trim(),
          referenceContact: applyRefContact.value.trim(),
        };
        await this.submitApplication(payload);
      };
    }

    const applyCloseBtn = document.getElementById("applyCloseBtn");
    if (applyCloseBtn) {
      applyCloseBtn.addEventListener("click", () => this.closeApplyModal());
    }
  },

  bindFilters() {
    const filterButtons = document.querySelectorAll(".pill[data-filter]");
    if (!filterButtons.length) return;
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.renderEventGrid(btn.dataset.filter);
      });
    });
  },

  startEditEvent(eventId) {
    const event = this.events.find((ev) => ev.id === eventId);
    if (!event) return;
    this.editingEventId = eventId;
    eventName.value = event.name || "";
    eventDate.value = event.date || "";
    eventVenue.value = event.venue || "";
    eventCategory.value = event.category || "";
    eventSlots.value = event.slots ?? "";
    eventTagline.value = event.tagline || "";
    eventStatus.value = event.status || "open";

    const submitBtn = document.getElementById("eventSubmitBtn");
    const cancelBtn = document.getElementById("eventCancelBtn");
    if (submitBtn) submitBtn.textContent = "Save Changes";
    if (cancelBtn) cancelBtn.style.display = "inline-flex";
  },

  resetEventForm() {
    const eventForm = document.getElementById("eventForm");
    if (!eventForm) return;
    eventForm.reset();
    if (typeof eventStatus !== "undefined") {
      eventStatus.value = "open";
    }
    this.editingEventId = null;
    const submitBtn = document.getElementById("eventSubmitBtn");
    const cancelBtn = document.getElementById("eventCancelBtn");
    if (submitBtn) submitBtn.textContent = "Add Event";
    if (cancelBtn) cancelBtn.style.display = "none";
  },

  async toggleEventStatus(eventId) {
    const event = this.events.find((ev) => ev.id === eventId);
    if (!event) return;
    try {
      const next = event.status === "closed" ? "open" : "closed";
      await this.api(`/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify({ status: next }),
      });
      await this.loadEvents();
      this.renderAll();
      this.toast(`Event ${next}`);
    } catch (err) {
      this.toast(err.message);
    }
  },


  renderAll() {
    this.renderMetrics();
    this.renderEventGrid();
    this.renderMyApplications();
    this.renderTables();
    this.renderAdminApplications();
  },

  renderMetrics() {
    const metricEvents = document.getElementById("metricEvents");
    const metricVols = document.getElementById("metricVols");
    const metricHours = document.getElementById("metricHours");
    if (metricEvents) metricEvents.textContent = this.events.length;
    if (metricVols) metricVols.textContent = this.volunteers.length || "--";
    if (metricHours) metricHours.textContent = (this.volunteers.length || 0) * 4;
  },

  renderEventGrid(filter = "all") {
    const grid = document.getElementById("eventGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const limit = Number(grid.dataset.limit || 0);
    const filtered = this.events.filter((ev) =>
      filter === "all" ? true : ev.category === filter
    );
    const list = limit ? filtered.slice(0, limit) : filtered;

    if (!list.length) {
      grid.innerHTML =
        '<div class="panel-card">No events yet. Check back soon.</div>';
      return;
    }

    list.forEach((ev) => {
      const card = document.createElement("div");
      card.className = "event-card";
      const slotsLeft = ev.slots_left ?? Math.max(0, ev.slots - (ev.applicants || 0));
      const isVolunteer = this.isVolunteerPage();
      const isOpen = (ev.status || "open") === "open";
      const canApply = isVolunteer && isOpen && slotsLeft > 0 && !ev.applied;
      card.innerHTML = `
        <div class="event-tag">${ev.category || "general"}</div>
        <div class="event-title">${ev.name}</div>
        <div class="event-meta">${ev.date} · ${ev.venue}</div>
        <p>${ev.tagline}</p>
        <div class="event-meta">${isOpen ? `Slots left: ${slotsLeft}` : "Closed"}</div>
        ${
          isVolunteer
            ? `<button class="action ${canApply ? "" : "disabled"}" ${
                canApply ? "" : "disabled"
              } onclick="App.applyToEvent(${ev.id})">${
                ev.applied ? "Applied" : isOpen ? (slotsLeft > 0 ? "Apply" : "Full") : "Closed"
              }</button>`
            : `<button class="action" onclick="App.toast('View details on the Events page')">Details</button>`
        }
      `;
      grid.appendChild(card);
    });
  },

  renderMyApplications() {
    const list = document.getElementById("myApplications");
    if (!list) return;
    list.innerHTML = "";
    if (!this.user) {
      list.innerHTML = '<div class="list-item">Login to track applications.</div>';
      return;
    }
    if (!this.applications.length) {
      list.innerHTML = '<div class="list-item">No applications yet.</div>';
      return;
    }
    this.applications.forEach((app) => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div>
          <strong>${app.event_name}</strong>
          <div class="event-meta">${app.status}</div>
        </div>
        <span class="chip">Applied</span>
      `;
      list.appendChild(item);
    });
  },

  renderTables() {
    const eventTable = document.getElementById("eventTable");
    if (eventTable) {
      eventTable.innerHTML = "";
      this.events.forEach((ev) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${ev.name}</td>
          <td>${ev.date}</td>
          <td>${ev.category}</td>
          <td>${ev.slots}</td>
          <td>${ev.applicants || 0}</td>
          <td><span class="chip ${ev.status === "closed" ? "chip--closed" : ""}">${ev.status || "open"}</span></td>
          <td>
            <div class="table-actions">
              <button class="action" onclick="App.startEditEvent(${ev.id})">Edit</button>
              <button class="ghost" onclick="App.toggleEventStatus(${ev.id})">${
                ev.status === "closed" ? "Reopen" : "Close"
              }</button>
              <button class="action" onclick="App.deleteEvent(${ev.id})">Delete</button>
            </div>
          </td>
        `;
        eventTable.appendChild(row);
      });
    }

    const volTable = document.getElementById("volTable");
    if (volTable) {
      volTable.innerHTML = "";
      const rejectedIds = new Set(
        this.applications
          .filter((app) => app.status === "rejected")
          .map((app) => app.user_id)
      );
      this.volunteers.forEach((vol) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${vol.name}</td>
          <td>${vol.skill || ""}</td>
          <td>${vol.availability || ""}</td>
          <td>
            ${
              rejectedIds.has(vol.user_id)
                ? '<span class="chip chip--closed">Rejected</span>'
                : '<span class="muted">—</span>'
            }
          </td>
          <td><button class="action" onclick="App.toast('Profile only')">View</button></td>
        `;
        volTable.appendChild(row);
      });
    }
  },

  renderAdminApplications() {
    const appTable = document.getElementById("appTable");
    if (!appTable) return;
    appTable.innerHTML = "";
    const visibleApps = this.applications.filter((app) => app.status !== "rejected");
    if (!visibleApps.length) {
      const row = document.createElement("tr");
      row.innerHTML = `<td class="muted" colspan="4">No applications yet.</td>`;
      appTable.appendChild(row);
      return;
    }
    visibleApps.forEach((app) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <strong>${app.user_name || "Volunteer"}</strong>
          <div class="event-meta">${app.user_email || ""}</div>
        </td>
        <td>${app.event_name}</td>
        <td><span class="chip ${app.status === "rejected" ? "chip--closed" : ""}">${app.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="ghost" onclick="App.toggleAppDetails(${app.id})">${
              this.expandedAppId === app.id ? "Hide" : "View"
            }</button>
            <button class="action" onclick="App.updateApplicationStatus(${app.id}, 'approved')">Approve</button>
            <button class="ghost" onclick="App.updateApplicationStatus(${app.id}, 'shortlisted')">Shortlist</button>
            <button class="action" onclick="App.updateApplicationStatus(${app.id}, 'rejected')">Reject</button>
          </div>
        </td>
      `;
      appTable.appendChild(row);

      if (this.expandedAppId === app.id) {
        const details = document.createElement("tr");
        details.innerHTML = `
          <td colspan="4" class="details-cell">
            <div class="details-grid">
              <div><strong>Phone:</strong> ${app.phone || "--"}</div>
              <div><strong>Age:</strong> ${app.age ?? "--"}</div>
              <div><strong>Availability:</strong> ${app.availability || "--"}</div>
              <div><strong>Experience:</strong> ${app.experience === "none" ? "Nil" : app.experience || "--"}</div>
              <div><strong>Motivation:</strong> ${app.motivation || "--"}</div>
              <div><strong>Reference:</strong> ${app.reference_name || "--"}</div>
              <div><strong>Reference Contact:</strong> ${app.reference_contact || "--"}</div>
            </div>
          </td>
        `;
        appTable.appendChild(details);
      }
    });
  },

  async deleteEvent(eventId) {
    try {
      await this.api(`/events/${eventId}`, { method: "DELETE" });
      await this.loadEvents();
      this.renderAll();
      this.toast("Event removed");
    } catch (err) {
      this.toast(err.message);
    }
  },

  async updateApplicationStatus(appId, status) {
    try {
      await this.api(`/applications/${appId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await this.loadAllApplications();
      this.renderAll();
      this.toast(`Marked ${status}`);
    } catch (err) {
      this.toast(err.message);
    }
  },

  toggleAppDetails(appId) {
    this.expandedAppId = this.expandedAppId === appId ? null : appId;
    this.renderAdminApplications();
  },

  async seedSample() {
    try {
      await this.api("/seed", { method: "POST" });
      await this.loadData();
      this.renderAll();
      this.toast("Sample data loaded");
    } catch (err) {
      this.toast(err.message);
    }
  },

  async applyToEvent(eventId) {
    if (!this.user) {
      window.location.href = "login.html?redirect=volunteer.html";
      return;
    }
    this.openApplyModal(eventId);
  },

  openApplyModal(eventId) {
    const modal = document.getElementById("applyModal");
    if (!modal) return;
    modal.classList.add("show");
    modal.dataset.eventId = String(eventId);
    const form = document.getElementById("applyForm");
    if (form) form.dataset.eventId = String(eventId);
  },

  closeApplyModal() {
    const modal = document.getElementById("applyModal");
    if (!modal) return;
    modal.classList.remove("show");
    modal.dataset.eventId = "";
    const form = document.getElementById("applyForm");
    if (form) {
      form.dataset.eventId = "";
      form.reset();
    }
  },

  async submitApplication(formData) {
    const eventId = Number(formData.eventId || 0);
    if (!eventId) return;
    const phoneDigits = String(formData.phone || "").replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      this.toast("Enter a valid 10-digit phone number");
      return;
    }
    const refDigits = String(formData.referenceContact || "").replace(/\D/g, "");
    if (refDigits && refDigits.length !== 10) {
      this.toast("Reference contact must be 10 digits");
      return;
    }
    if (!formData.age || Number.isNaN(Number(formData.age))) {
      this.toast("Enter a valid age");
      return;
    }
    if (!formData.availability || !formData.experience || !formData.motivation) {
      this.toast("Please complete all required fields");
      return;
    }
    if (String(formData.motivation).length > 1000) {
      this.toast("Motivation is too long (max 1000 chars)");
      return;
    }
    try {
      await this.api("/applications", {
        method: "POST",
        body: JSON.stringify({
          event_id: eventId,
          phone: phoneDigits,
          age: Number(formData.age),
          availability: formData.availability,
          experience: formData.experience,
          motivation: formData.motivation,
          reference_name: formData.referenceName,
          reference_contact: refDigits,
        }),
      });
      await this.loadEvents();
      await this.loadApplications();
      this.renderAll();
      this.closeApplyModal();
      this.toast("Application submitted");
    } catch (err) {
      this.toast(err.message);
    }
  },

  initSparkline() {
    const canvas = document.getElementById("sparkline");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const data = [8, 10, 9, 12, 15, 18, 16];
    const step = w / (data.length - 1);
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = i * step;
      const y = h - (d / 20) * h + 6;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = "rgba(34,211,238,0.15)";
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  },

  toggleTheme() {
    document.documentElement.classList.toggle("light");
  },

  toast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
