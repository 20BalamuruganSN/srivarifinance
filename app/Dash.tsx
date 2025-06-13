import React, { useState, useEffect, useCallback } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useFocusEffect } from "@react-navigation/native";

// Import your screens
import ViewLoan from "./ViewLoan";
import Loan from "./Loan";
import Customer from "./Customer";
import PendingList from "./PendingList";
import DueList from "./DueList";
import Home from "./Home";
import Employees from "./Employees";

const Drawer = createDrawerNavigator();

const menuItems = [
  { label: "Home", icon: "home", route: "Home" },
  { label: "Employees", icon: "user-tie", route: "Employees" },
  { label: "Customers", icon: "users", route: "Customer" },
  { label: "Loans", icon: "credit-card", route: "ViewLoan" },
  { label: "Due List", icon: "list", route: "DueList" },
  { label: "Pending Due", icon: "clock", route: "PendingList" },
];

type Props = {
  navigation: any;
};

const CustomDrawerContent = (props: Props) => {
  const [activeRoute, setActiveRoute] = useState("DashBoard");
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    imageUri: null,
  });
  const [role, setRole] = useState<string | null>(null); // Store role here

  // Load profile and role from AsyncStorage
  const loadProfileAndRole = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem("userProfile");
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile({
          name: parsedProfile.name || "",
          phone: parsedProfile.phone || "",
          imageUri: parsedProfile.imageUri || null,
        });
      } else {
        setProfile({ name: "", phone: "", imageUri: null });
      }

      const storedRole = await AsyncStorage.getItem("role");
      if (storedRole) {
        setRole(storedRole);
      } else {
        setRole(null);
      }
    } catch (err) {
      console.error("Failed to load profile or role:", err);
    }
  };

  // Reload profile and role when drawer is focused
  useFocusEffect(
    useCallback(() => {
      loadProfileAndRole();
    }, [])
  );

  const handleNavigation = (route: string) => {
    setActiveRoute(route);
    props.navigation.navigate(route);
  };

  return (
    <ScrollView style={styles.drawerContainer}>
      {/* Profile Section */}
      <View style={styles.profileCard}>
        <View style={styles.profileImageContainer}>
          <Image
            source={
              profile.imageUri
                ? { uri: profile.imageUri }
                : require("../assets/images/logo.png")
            }
            style={styles.profileImage}
          />
          {/* Green status indicator */}
          <View style={styles.statusIndicator} />
        </View>
        <View style={styles.profileDetails}>
          <Text style={styles.profileName}>{profile.name || "Guest User"}</Text>
          <Text style={styles.profilePhone}>{profile.phone || "No phone"}</Text>
        </View>
      </View>

      {/* Menu Items with role-based condition */}
      {menuItems.map((item) => {
        // Hide "Employees" menu for users with role "employee"
        if (item.label === "Employees" && role === "employee") {
          return null;
        }
        const isActive = activeRoute === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            onPress={() => handleNavigation(item.route)}
            style={[styles.menuItem, isActive && styles.activeItem]}
          >
            <FontAwesome5
              name={item.icon}
              size={20}
              color={isActive ? "#06387A" : "#c0d9f0"}
              style={styles.icon}
            />
            <Text style={[styles.menuText, isActive && styles.activeText]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Sign Out Button */}
      <View style={styles.signOutContainer}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert("Logged out", "You have been successfully logged out.");
              props.navigation.reset({ index: 0, routes: [{ name: "Login" }] });
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to log out.");
            }
          }}
        >
          <AntDesign name="logout" size={20} color="#ffffff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState("DashBoard");

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerTintColor: "white",
        headerStyle: {
          backgroundColor: "#06387A",
        },
      }}
      screenListeners={{
        state: (e) => {
          const routes = e.data.state.routes;
          const index = e.data.state.index;
          const routeName = routes[index].name;
          setCurrentRoute(routeName);
        },
      }}
    >
      {/* Screens */}
      <Drawer.Screen
        name="Home"
        component={Home}
        options={{ headerTitle: "Home" }}
      />

      <Drawer.Screen
        name="Employees"
        component={Employees}
        options={{ headerTitle: "Employees" }}
      />

      <Drawer.Screen
        name="Customer"
        component={Customer}
        options={{ headerTitle: "Customers" }}
      />

      <Drawer.Screen
        name="ViewLoan"
        component={ViewLoan}
        options={{ headerTitle: "View Loan" }}
      />

      <Drawer.Screen
        name="DueList"
        component={DueList}
        options={{ headerTitle: "Due List" }}
      />

      <Drawer.Screen
        name="PendingList"
        component={PendingList}
        options={{ headerTitle: "Pending Loans" }}
      />

      <Drawer.Screen
        name="Loan"
        component={Loan}
        options={{ headerTitle: "Loan" }}
      />

      {/* <Drawer.Screen
        name="Employee List"
        component={Manage}
        options={{ headerTitle: "Employees" }}
      /> */}
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#06387A",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 60,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "white",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "green",
    borderWidth: 2,
    borderColor: "white",
  },
  profileDetails: {
    marginLeft: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  profilePhone: {
    fontSize: 14,
    color: "white",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  activeItem: {
    backgroundColor: "white",
    borderRadius: 10,
  },
  icon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: "#c0d9f0",
  },
  activeText: {
    color: "#06387A",
    fontWeight: "bold",
  },
  signOutContainer: {
    marginTop: "auto",
    padding: 20,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFC107",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    marginTop: 100,
    justifyContent: "center",
  },
  signOutText: {
    color: "white",
    fontSize: 16,
    marginLeft: 10,
  },
});