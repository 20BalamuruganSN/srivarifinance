import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Create from "./CreateCustomer";
// import Manage from "./CustomerList";
// import Dash from "./tabNavigationEmp";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import ViewLoan from "./ViewLoan";
import Loan from "./Loan";
import Customer from "./Customer";

import PendingList from "./PendingList";
import DueList from "./DueList";
import Home from "./Home";
import LoanCalculatorScreen from "./LoanCalculatorScreen";
// import Employees from "./Employees";

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: {
  navigation: { navigate: (arg0: string) => void };
}) => {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, padding: 20, marginTop: 45 }}>
        <Text
          onPress={() => props.navigation.navigate("tabNavigationEmp")}
          style={styles.drawertext}
        >
          <FontAwesome5 name="home" size={24} color="black" /> Home
        </Text>
        <Text
          onPress={() => props.navigation.navigate("Manager_menu")}
          style={styles.drawertext}
        >
          <FontAwesome5 name="users" size={22} color="black" /> Customers
        </Text>
        <Text
          onPress={() => props.navigation.navigate("Loan")}
          style={styles.drawertext}
        >
          <FontAwesome5 name="credit-card" size={24} color="black" /> Loan
        </Text>
        {/* <Text
          onPress={() => props.navigation.navigate("Loan_Due")}
          style={styles.drawertext}
        >
          <AntDesign name="idcard" size={24} color="black" /> Loan Due
        </Text> */}

        {/* <Text
          onPress={() => props.navigation.navigate("ViewLoan")}
          style={styles.drawertext}
        >
          <FontAwesome5 name="credit-card" size={24} color="black" />View Loan
        </Text> */}
        {/* <Text
          onPress={() => props.navigation.navigate("Manager_menu")}
          style={styles.drawertext}
        >
          <FontAwesome5 name="clipboard-list" size={24} color="black" />{" "}
          Customers List
        </Text> */}
        {/* <Text
          onPress={() => props.navigation.navigate("LoanCategory")}
          style={styles.drawertext}
        >
          <MaterialIcons name="category" size={24} color="black" /> LoanCategory
        </Text> */}
        {/* <Text
          onPress={() => props.navigation.navigate("ViewLoanCategory")}
          style={styles.drawertext}
        >
           <MaterialIcons name="category" size={24} color="black" /> Loan Category
        </Text> */}
        <Text
          onPress={() => props.navigation.navigate("CollectionCity")}
          style={styles.drawertext}
        >
          <MaterialIcons name="collections-bookmark" size={24} color="black" />{" "}
          Due List
        </Text>
        <Text
          onPress={() => props.navigation.navigate("pending")}
          style={styles.drawertext}
        >
          <MaterialIcons name="pending-actions" size={24} color="black" />
          Pending Loans
        </Text>

        <View style={{ flex: 1 }} />

        <Text
          onPress={async () => {
            try {
              await AsyncStorage.removeItem("userid");
              await AsyncStorage.removeItem("token");
              await AsyncStorage.removeItem("role");
              Alert.alert(
                "Logged out",
                "You have been successfully logged out."
              );
              props.navigation.navigate("Login");
            } catch (error) {
              // console.error("Error logging out:", error);
              Alert.alert("Error", "Failed to log out.");
            }
          }}
          style={styles.drawertext}
        >
          <AntDesign name="logout" size={24} color="black" /> Sign Out
        </Text>
      </View>
    </ScrollView>
  );
};

export default function App() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="tabNavigationEmp"
        component={Home}
        options={{
          headerShown: true,
          headerTitle: "Home",
          headerStyle: {},
        }}
      />
      <Drawer.Screen
        name="ViewLoan"
        component={ViewLoan}
        options={{
          headerTitle: "View Loan",
          headerTintColor: "white",
          headerStyle: {
            backgroundColor: "#07387A",
          },
        }}
      />
      <Drawer.Screen
        name="CollectionCity"
        component={PendingList}
        options={{
          headerTitle: "Collection View",
          headerTintColor: "white",
          headerStyle: {
            backgroundColor: "#07387A",
          },
        }}
      />
      <Drawer.Screen
        name="CreateEmp"
        component={Create}
        options={{
          headerShown: true,
          headerTintColor: "white",
          headerTitle: "Add Customers",
          headerStyle: { backgroundColor: "#07387A" },
        }}
      />
      <Drawer.Screen
        name="pending"
        component={PendingList}
        options={{
          headerShown: true,
          headerTintColor: "white",
          headerTitle: "Pending Loans",
          headerStyle: { backgroundColor: "#07387A" },
        }}
      />
      {/* <Drawer.Screen
        name="LoanCategory"
        component={LoanCategory}
        options={{
          headerShown: true,
          headerTintColor: "white",
          headerTitle: "LoanCategory",
          headerStyle: { backgroundColor: "#07387A" },
        }}
      /> */}
      {/* <Drawer.Screen
        name="ViewLoanCategory"
        component={Viewloancategory}
        options={{
          headerTitle: "Add Loan Category",
          headerTintColor: "white",
          headerStyle: {
            backgroundColor: "#07387A",
          },
        }}
      /> */}
      <Drawer.Screen
        name="Loan"
        component={Loan}
        options={{
          headerShown: true,
          headerTintColor: "white",
          headerTitle: "Loan",
          headerStyle: { backgroundColor: "#07387A" },
        }}
      />
      {/* <Drawer.Screen
        name="Manager_menu"
        component={Employees}
        options={{
          headerShown: true,
          headerTitle: "Customers List",
          headerTintColor: "white",
          headerStyle: { backgroundColor: "#07387A" },
        }}
      /> */}
      <Drawer.Screen
        name="Loan_Due"
        component={Loan}
        options={{
          headerShown: true,
          headerTintColor: "white",
          headerTitle: "Loan Due",
          headerStyle: { backgroundColor: "#07387A" },
        }}
      />

      <Drawer.Screen
        name="Loan_Calculator"
        component={LoanCalculatorScreen}
        options={{
          headerShown: true,
          headerTintColor: "white",
          headerTitle: "Calculator",
          headerStyle: { backgroundColor: "#07387A" },
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawertext: {
    fontSize: 19,
    padding: 15,
    borderBottomColor: "gray",
    borderBottomWidth: 1,
  },
});
