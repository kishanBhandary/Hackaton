/* noop service worker placeholder to avoid 404 during local dev */
self.addEventListener("install", () => {
  self.skipWaiting();
});
