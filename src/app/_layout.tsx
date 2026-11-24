
import { Stack } from "expo-router";

import { AuthProvider, useAuth } from "../contexts/AuthContext";

function RootNavigation() {
  const { session, loading } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!loading && !session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!loading && !!session}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="detail" options={{ headerShown: true, title: "Detail Buku" }} />
        <Stack.Screen name="explore" options={{ headerShown: true, title: "Explore" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
