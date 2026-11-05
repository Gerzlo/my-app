// HTML-обёртка веб-версии: заголовок, язык и настройки для «На экран Домой» на iPhone.
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* viewport-fit=cover — учитываем «чёлку» и нижнюю полосу iPhone */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <title>Что купить</title>
        {/* Открывается на весь экран, когда добавлено на экран «Домой» */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Что купить" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: baseStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Фон под цвет темы, чтобы при прокрутке не мелькал белый край.
const baseStyles = `
body { background-color: #ffffff; }
@media (prefers-color-scheme: dark) {
  body { background-color: #000000; }
}
`;
