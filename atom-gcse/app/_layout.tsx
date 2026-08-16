import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LearnerProvider } from '@/state/LearnerContext';
import { colours } from '@/ui/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LearnerProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colours.surface },
            headerTitleStyle: { color: colours.text },
            headerTintColor: colours.primary,
            contentStyle: { backgroundColor: colours.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="practice/[topicId]"
            options={{ title: 'Practice', headerBackTitle: 'Exit' }}
          />
          <Stack.Screen
            name="practice/results"
            options={{ title: 'Session complete', headerBackVisible: false }}
          />
        </Stack>
      </LearnerProvider>
    </SafeAreaProvider>
  );
}
