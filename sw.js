const CACHE = "monstres-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./game.js",
  "./manifest.webmanifest",
  "./assets/images/background.png",
  "./assets/images/error.png",
  "./assets/images/victory.png",
  "./assets/images/thorgal.png",
  "./assets/images/fantome.png",
  "./assets/images/sorciere.png",
  "./assets/images/vampire.png",
  "./assets/images/yeti.png",
  "./assets/images/zombie.png",
  "./assets/audio/boo.wav",
  "./assets/audio/clap.wav",
  "./assets/audio/fantome.wav",
  "./assets/audio/sorciere.wav",
  "./assets/audio/vampire.wav",
  "./assets/audio/yeti.wav",
  "./assets/audio/zombie.wav"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
