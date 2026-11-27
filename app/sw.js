// Service worker: guarda os arquivos do app para funcionar offline.
// Aumente a versão sempre que publicar mudanças.
const CACHE = 'daily-quest-v2';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'fonts/press-start-2p.woff2', 'fonts/vt323.woff2',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/app.js', 'js/agenda.js', 'js/cloud.js', 'js/cloud-config.js', 'js/data.js', 'js/dates.js', 'js/game.js', 'js/nav.js',
  'js/sfx.js', 'js/sprites.js', 'js/store.js', 'js/ui.js',
  'js/screens/content.js', 'js/screens/group.js', 'js/screens/hero.js', 'js/screens/library.js', 'js/screens/onboarding.js',
  'js/screens/quests.js', 'js/screens/sectors.js', 'js/screens/shop.js', 'js/screens/today.js',
];
// O SDK do Firebase (app/vendor) não entra aqui: só é baixado e guardado se a nuvem for usada.

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Rede primeiro (para receber atualizações), cache como reserva offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))),
  );
});

// Tocar numa notificação de lembrete abre (ou traz para a frente) o app.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) return c.focus();
      return self.clients.openWindow('./');
    }),
  );
});
