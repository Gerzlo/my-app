import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { WebHead } from '@/components/web-head';
import { ShoppingProvider } from '@/data/shopping-store';

SplashScreen.preventAutoHideAsync();

// При запуске открывается вкладка «Список», хотя слева теперь «Частые».
export const unstable_settings = {
  anchor: 'index',
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WebHead />
      <ShoppingProvider>
        <AnimatedSplashOverlay />
        <AppTabs />
      </ShoppingProvider>
    </ThemeProvider>
  );
}
