self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "🛎️ Nuevo pedido", {
      body: data.body ?? "",
      icon: "/takefyy-logo.png",
      badge: "/takefyy-logo.png",
      data: { url: data.url ?? "/" },
      requireInteraction: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  if (!url) return;
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      }),
  );
});
