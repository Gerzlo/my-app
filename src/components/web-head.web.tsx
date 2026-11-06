// Заголовок страницы и настройки для «На экран Домой» на iPhone (только веб-версия).
import Head from 'expo-router/head';
import { useEffect } from 'react';

import appJson from '../../app.json';

const BASE = (appJson.expo.experiments?.baseUrl ?? '').replace(/\/$/, '');

// Офлайн-режим: регистрируем sw.js, который хранит файлы приложения в телефоне.
// В режиме разработки (npx expo start) не включаем, чтобы не мешал правкам.
function useOffline() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register(`${BASE}/sw.js`, { scope: `${BASE}/` })
      .catch((error) => console.warn('Офлайн-режим не включился', error));
  }, []);
}

export function WebHead() {
  useOffline();
  return (
    <Head>
      <title>Что купить</title>
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Что купить" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#000000" />
      {/* Путь без «/» в начале — сайт живёт в подпапке /my-app на GitHub Pages */}
      <link rel="apple-touch-icon" href="apple-touch-icon.png" />
    </Head>
  );
}
