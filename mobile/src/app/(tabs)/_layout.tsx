/**
 * (tabs)/_layout.tsx — the five tabs: Status, Map, Route, Report, More.
 * First-time users are sent to the short onboarding first (shown once).
 */
// SDK 58 doesn't re-export Redirect from 'expo-router/link', so it's imported from its own file.
import { Redirect } from 'expo-router/build/link/Redirect';
import { Tabs } from 'expo-router/js-tabs';
import { platform } from '../../../../shared/platform';
import { TabBar } from '../../components/TabBar';
import { ONBOARDED_KEY } from '../onboarding';

export default function TabsLayout() {
  if (platform().storage.getItem(ONBOARDED_KEY) !== '1') return <Redirect href="/onboarding" />;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Status' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="route" options={{ title: 'Route' }} />
      <Tabs.Screen name="report" options={{ title: 'Report' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
