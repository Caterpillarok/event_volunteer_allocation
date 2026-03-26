import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [toast, setToast] = useState(null);

  const api = async (path, options = {}) => {
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
  };

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const fetchMe = async () => {
    try {
      const me = await api("/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await api("/events");
      setEvents(data || []);
    } catch {
      setEvents([]);
    }
  };

  const loadVolunteers = async () => {
    try {
      const data = await api("/volunteers");
      setVolunteers(data || []);
    } catch {
      setVolunteers([]);
    }
  };

  const loadApplications = async () => {
    try {
      const data = await api("/applications");
      setApplications(data || []);
    } catch {
      setApplications([]);
    }
  };

  const loadAllApplications = async () => {
    try {
      const data = await api("/applications/all");
      setApplications(data || []);
    } catch {
      setApplications([]);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      loadVolunteers();
      loadAllApplications();
    } else {
      setVolunteers([]);
    }
    if (user?.role === "volunteer") {
      loadApplications();
    } else {
      if (user?.role !== "admin") setApplications([]);
    }
  }, [user]);

  const login = async (payload) => {
    const data = await api("/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setUser(data);
    await loadEvents();
    if (data?.role === "admin") {
      await loadVolunteers();
      await loadAllApplications();
    }
    if (data?.role === "volunteer") {
      await loadApplications();
    }
    return data;
  };

  const register = async (payload) => {
    const data = await api("/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setUser(data);
    await loadEvents();
    await loadApplications();
    return data;
  };

  const logout = async () => {
    try {
      await api("/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
  };

  const createEvent = async (payload) => {
    const data = await api("/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await loadEvents();
    return data;
  };

  const updateEvent = async (id, payload) => {
    const data = await api(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    await loadEvents();
    return data;
  };

  const deleteEvent = async (id) => {
    await api(`/events/${id}`, { method: "DELETE" });
    await loadEvents();
  };

  const updateProfile = async (payload) => {
    const data = await api("/volunteers/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (user?.role === "admin") {
      await loadVolunteers();
    }
    return data;
  };

  const applyToEvent = async (eventId, payload) => {
    const data = await api("/applications", {
      method: "POST",
      body: JSON.stringify({ event_id: eventId, ...payload }),
    });
    await loadEvents();
    await loadApplications();
    return data;
  };

  const cancelApplication = async (appId) => {
    await api(`/applications/${appId}`, { method: "DELETE" });
    await loadEvents();
    await loadApplications();
  };

  const updateApplicationStatus = async (appId, status) => {
    const data = await api(`/applications/${appId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (user?.role === "admin") {
      await loadAllApplications();
      await loadEvents();
    }
    return data;
  };

  const seedSample = async () => {
    await api("/seed", { method: "POST" });
    await loadEvents();
    if (user?.role === "admin") {
      await loadVolunteers();
    }
  };

  const value = useMemo(
    () => ({
      api,
      user,
      userLoading,
      events,
      volunteers,
      applications,
      toast,
      showToast,
      login,
      register,
      logout,
      createEvent,
      updateEvent,
      deleteEvent,
      updateProfile,
      applyToEvent,
      cancelApplication,
      updateApplicationStatus,
      seedSample,
      refreshEvents: loadEvents,
      refreshApplications:
        user?.role === "admin" ? loadAllApplications : loadApplications,
    }),
    [user, userLoading, events, volunteers, applications, toast]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
