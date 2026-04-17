import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0b172a' },
        headerTintColor: '#e2e8f0',
        contentStyle: { backgroundColor: '#06111f' },
      }}
    />
  );
}
