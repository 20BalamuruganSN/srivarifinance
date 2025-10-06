import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  
  const [appReady, setAppReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().then(() => setAppReady(true));
    }
  }, [loaded]);

  useEffect(() => {
    if (appReady) {
      router.replace("/Welcome");
    }
  }, [appReady]);

  if (!loaded) return null;

  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const bgColor = colorScheme === 'dark' ? '#000' : '#fff';
  const getHeaderOptions = (title: string, backRoute: string) => ({
    headerShown: true,
    headerStyle: { backgroundColor: bgColor },
    headerTitle: () => (
      <Text
        style={{
          marginLeft: 20,
          // marginTop: 40,
          fontSize: 20,
          fontWeight: 'bold',
          color: textColor,
        }}
      >
        {title}
      </Text>
    ),
    headerLeft: () => (
      <TouchableOpacity
        onPress={() => router.replace(backRoute)}
        // style={{ marginLeft: 0, marginTop: 0 }}
      >
        <Ionicons name="arrow-back" size={22} color={textColor} />
      </TouchableOpacity>
    ),
  });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="Welcome" options={{ headerShown: false }} />
        <Stack.Screen name="Login" options={{ headerShown: false }} />
       
       <Stack.Screen 
  name="Forgetpassword"
 
  options={({ navigation }) => ({
    headerShown: true,
    title: 'Forget Password',
    headerLeft: () => (
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginLeft: 10 }}>
        <Text style={{ fontSize: 30 }}>{'\u2190'}</Text> {/* ← arrow symbol */}
      </TouchableOpacity>
    ),
  })}
/>

      <Stack.Screen 
  name="Otp" 
 
  options={({ navigation }) => ({
    headerShown: true,
    headerLeft: () => (
      <TouchableOpacity onPress={() => navigation.navigate('Forgetpassword')} style={{ marginLeft: 10 }}>
         <Text style={{ fontSize: 30 }}>{'\u2190'}</Text> {/* ← arrow symbol */}
      </TouchableOpacity>
    ),
  })}
/>

    <Stack.Screen 
  name="ChangePassword" 

  options={({ navigation }) => ({
    headerShown: true,
    headerLeft: () => (
      <TouchableOpacity onPress={() => navigation.navigate('Otp')} style={{ marginLeft: 10 }}>
         <Text style={{ fontSize: 30 }}>{'\u2190'}</Text> {/* ← arrow symbol */}
      </TouchableOpacity>
    ),
  })}
/>

        <Stack.Screen name="Home" options={{ headerShown: false }} />
        <Stack.Screen name="Dash" options={{ headerShown: false }} />

        <Stack.Screen name="ViewLoan" options={getHeaderOptions("View Loan", "/(tabs)")} />
        <Stack.Screen name="PendingList" options={getHeaderOptions("Pending List", "/(tabs)")} />
        <Stack.Screen name="Employees" options={getHeaderOptions("Employees", "/(tabs)")} />
         <Stack.Screen name="EditLoan" options={getHeaderOptions("Edit Loan", "/ViewLoan")} />
        <Stack.Screen name="Customer" options={getHeaderOptions("Customer", "/(tabs)")} />
        <Stack.Screen name="CreateCustomer" options={getHeaderOptions("Create Customer", "/Customer")} />
        <Stack.Screen name="EditCustomer" options={getHeaderOptions("Edit Customer", "/Customer")} />
        <Stack.Screen name="CreateEmployees" options={getHeaderOptions("Create Employees", "/Employees")} />
        <Stack.Screen name="EditEmployees" options={getHeaderOptions("Edit Employees", "/Employees")} />

        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
