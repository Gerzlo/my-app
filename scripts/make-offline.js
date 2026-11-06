// Офлайн-режим: после сборки создаёт dist/sw.js со списком всех файлов приложения.
// Телефон один раз скачивает их и потом открывает приложение без интернета.
// Версия меняется при любом изменении файлов — так телефон узнаёт об обновлении.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const appJson = require('../app.json');
const BASE = (appJson.expo.experiments?.baseUrl ?? '').replace(/\/$/, '');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const hash = crypto.createHash('sha256');
const files = walk(DIST)
  .map((full) => path.relative(DIST, full).split(path.sep).join('/'))
  .filter((rel) => rel !== 'sw.js' && !rel.endsWith('.map') && rel !== '.nojekyll')
  .sort();
for (const rel of files) {
  hash.update(rel);
  hash.update(fs.readFileSync(path.join(DIST, rel)));
}
const version = hash.digest('hex').slice(0, 12);
const urls = files.map((rel) => `${BASE}/${rel}`);

const sw = `// Создано автоматически скриптом scripts/make-offline.js — не редактировать.
const VERSION = ${JSON.stringify(version)};
const BASE = ${JSON.stringify(BASE)};
const CACHE = 'app-' + VERSION;
const FILES = ${JSON.stringify(urls, null, 2)};

// Установка: скачиваем все файлы приложения.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

// Новая версия готова — удаляем старые.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Страницы: «/my-app/frequent» лежит в файле frequent.html, «/my-app/» — в index.html.
function pageFile(pathname) {
  let p = pathname.slice(BASE.length).replace(/\\/$/, '');
  if (p === '') return BASE + '/index.html';
  return p.endsWith('.html') ? BASE + p : BASE + p + '.html';
}

// Сначала берём из телефона (работает без связи), иначе — из интернета.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE + '/')) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (request.mode === 'navigate') {
        const page =
          (await cache.match(pageFile(url.pathname))) ||
          (await cache.match(BASE + '/index.html'));
        if (page) return page;
      }
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      return fetch(request);
    })()
  );
});
`;

fs.writeFileSync(path.join(DIST, 'sw.js'), sw);
console.log(`Офлайн-режим: ${files.length} файлов, версия ${version}`);
