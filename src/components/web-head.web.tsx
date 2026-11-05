// Заголовок страницы и настройки для «На экран Домой» на iPhone (только веб-версия).
import Head from 'expo-router/head';

export function WebHead() {
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
