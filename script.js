const App = {
  user: null,
  events: [],
  volunteers: [],
  applications: [],

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
          await this.api("/events", {
            method: "POST",
            body: JSON.stringify({
              name: eventName.value,
              date: eventDate.value,
              venue: eventVenue.value,
              category: eventCategory.value,
              slots: eventSlots.value,
              tagline: eventTagline.value,
            }),
          });
          await this.loadEvents();
          this.renderAll();
          eventForm.reset();
          this.toast("Event Added");
        } catch (err) {
          this.toast(err.message);
        }
      };
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


  renderAll() {
    this.renderMetrics();
    this.renderEventGrid();
    this.renderMyApplications();
    this.renderTables();
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
      const canApply = isVolunteer && slotsLeft > 0 && !ev.applied;
      card.innerHTML = `
        <div class="event-tag">${ev.category || "general"}</div>
        <div class="event-title">${ev.name}</div>
        <div class="event-meta">${ev.date} · ${ev.venue}</div>
        <p>${ev.tagline}</p>
        <div class="event-meta">Slots left: ${slotsLeft}</div>
        ${
          isVolunteer
            ? `<button class="action ${canApply ? "" : "disabled"}" ${
                canApply ? "" : "disabled"
              } onclick="App.applyToEvent(${ev.id})">${
                ev.applied ? "Applied" : slotsLeft > 0 ? "Apply" : "Full"
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
          <td><button class="action" onclick="App.deleteEvent(${ev.id})">Delete</button></td>
        `;
        eventTable.appendChild(row);
      });
    }

    const volTable = document.getElementById("volTable");
    if (volTable) {
      volTable.innerHTML = "";
      this.volunteers.forEach((vol) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${vol.name}</td>
          <td>${vol.skill || ""}</td>
          <td>${vol.availability || ""}</td>
          <td><button class="action" onclick="App.toast('Profile only')">View</button></td>
        `;
        volTable.appendChild(row);
      });
    }
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
    try {
      await this.api("/applications", {
        method: "POST",
        body: JSON.stringify({ event_id: eventId }),
      });
      await this.loadEvents();
      await this.loadApplications();
      this.renderAll();
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
