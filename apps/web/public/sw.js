// Minimal by design. A student on mobile data should not be paying for
// prefetched pages they may never open, and stale academic data is worse
// than none — a cached timetable showing a class that moved is a student
// in the wrong room.
const SHELL = "campusos-shell-v1";
const SHELL_FILES = ["/offline", "/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// Network first, and only fall back to the offline page for navigations.
// Nothing academic is served from cache.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => caches.match("/offline")));
});

self.addEventListener("push", (e) => {
  if (!e.data) return;
  let n;
  try { n = e.data.json(); } catch { return; }

  e.waitUntil(
    self.registration.showNotification(n.title, {
      body: n.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      // Collapses repeats: a second message in the same room replaces
      // the first rather than stacking.
      tag: n.tag,
      data: { url: n.url },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/today";

  // Focus an open tab rather than opening a second one.
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    }),
  );
});
