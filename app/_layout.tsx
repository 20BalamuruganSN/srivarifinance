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
const [appReady,setAppReady]=useState(false)
const router=useRouter()

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
  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="Welcome" options={{ headerShown: false }} />
        <Stack.Screen name="Login" options={{ headerShown: false }} />
        <Stack.Screen name="Forgetpassword" options={{ headerShown: false }} />
        <Stack.Screen name="Otp" options={{ headerShown: false }} />
        <Stack.Screen name="ChangePassword" options={{ headerShown: false }} />
         <Stack.Screen name="Home" options={{ headerShown: false }} />
        <Stack.Screen name="Dash" options={{ headerShown: false }} />
      
         <Stack.Screen
        name="ViewLoan"
 
       options={{
  headerShown: true,
  headerTitle: () => (
    <Text
      style={{
        marginLeft: 20,
        marginTop: 40,
        fontSize: 24,
        fontWeight: 'bold',
      }}
    >
      View Loan
    </Text>
  ),
  headerLeft: () => (
   
      <TouchableOpacity  onPress={() => router.replace('/(tabs)')} style={{ marginLeft: 10, marginTop: 40 }}>
        <Ionicons name="arrow-back" size={32} color="black" />
      </TouchableOpacity>
 
  ),
}}
/>
<Stack.Screen
        name="PendingList"
 
       options={{
  headerShown: true,
  headerTitle: () => (
    <Text
      style={{
        marginLeft: 20,
        marginTop: 40,
        fontSize: 24,
        fontWeight: 'bold',
      }}
    >
      Pending List
    </Text>
  ),
  headerLeft: () => (
   
      <TouchableOpacity  onPress={() => router.replace('/(tabs)')} style={{ marginLeft: 10, marginTop: 40 }}>
        <Ionicons name="arrow-back" size={32} color="black" />
      </TouchableOpacity>
 
  ),
}}
/>
<Stack.Screen
        name="Employees"
 
       options={{
  headerShown: true,
  headerTitle: () => (
    <Text
      style={{
        marginLeft: 20,
        marginTop: 40,
        fontSize: 24,
        fontWeight: 'bold',
      }}
    >
      Employees
    </Text>
  ),
  headerLeft: () => (
   
      <TouchableOpacity  onPress={() => router.replace('/(tabs)')} style={{ marginLeft: 10, marginTop: 40 }}>
        <Ionicons name="arrow-back" size={32} color="black" />
      </TouchableOpacity>
 
  ),
}}
/>
<Stack.Screen
        name="Customer"
 
       options={{
  headerShown: true,
  headerTitle: () => (
    <Text
      style={{
        marginLeft: 20,
        marginTop: 40,
        fontSize: 24,
        fontWeight: 'bold',
      }}
    >
      Customer
    </Text>
  ),
  headerLeft: () => (
   
      <TouchableOpacity  onPress={() => router.replace('/(tabs)')} style={{ marginLeft: 10, marginTop: 40 }}>
        <Ionicons name="arrow-back" size={32} color="black" />
      </TouchableOpacity>
 
  ),
}}
/>
<Stack.Screen
        name="CreateCustomer"
 
       options={{
  headerShown: true,
  headerTitle: () => (
    <Text
      style={{
        marginLeft: 20,
        marginTop: 40,
        fontSize: 24,
        fontWeight: 'bold',
      }}
    >
      Create Customer
    </Text>
  ),
  headerLeft: () => (
   
      <TouchableOpacity  onPress={() => router.replace('/Customer')} style={{ marginLeft: 10, marginTop: 40 }}>
        <Ionicons name="arrow-back" size={32} color="black" />
      </TouchableOpacity>
 
  ),
}}
/>

<Stack.Screen
  name="EditCustomer"
  options={{
  headerShown: true,
  headerTitle: () => (
    <Text
      style={{
        marginLeft: 20,
        marginTop: 40,
        fontSize: 24,
        fontWeight: 'bold',
      }}
    >
      Edit Customer
    </Text>
  ),
  headerLeft: () => (
   
      <TouchableOpacity  onPress={() => router.replace('/Customer')} style={{ marginLeft: 10, marginTop: 40 }}>
        <Ionicons name="arrow-back" size={32} color="black" />
      </TouchableOpacity>
 
  ),
}}
/>

<Stack.Screen
        name="CreateEmployees"
 
       options={{
  headerShown: true,
  headerTitle: () => (
    <Text
      style={{
        marginLeft: 20,
        marginTop: 40,
        fontSize: 24,
        fontWeight: 'bold',
      }}
    >
      Create Employees
    </Text>
  ),
  headerLeft: () => (
   
      <TouchableOpacity  onPress={() => router.replace('/Employees')} style={{ marginLeft: 10, marginTop: 40 }}>
        <Ionicons name="arrow-back" size={32} color="black" />
      </TouchableOpacity>
 
  ),
}}
/>


<Stack.Screen
        name="EditEmployees"
 
       options={{
  headerShown: true,
  headerTitle: () => (
    <Text
      style={{
        marginLeft: 20,
        marginTop: 40,
        fontSize: 24,
        fontWeight: 'bold',
      }}
    >
      Edit Employees
    </Text>
  ),
  headerLeft: () => (
   
      <TouchableOpacity  onPress={() => router.replace('/Employees')} style={{ marginLeft: 10, marginTop: 40 }}>
        <Ionicons name="arrow-back" size={32} color="black" />
      </TouchableOpacity>
 
  ),
}}
/>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}