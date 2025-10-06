// ... your imports remain unchanged
import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  BackHandler,
  Alert,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import api from "./Api";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LoanHistoryResponse {
  from_date: string;
  to_date: string;
  total_loans: number;
  total_amount: string;
  received_amount: string;
  total_collection: number;
  loans: any[]; // or whatever structure
}

const Home = () => {
  const router = useRouter();
  const [totalCollection, setTotalCollection] = useState(0);
  const [EmployeesCount, setEmployeesCount] = useState(0);
  const [CustomerCount, setCustomerCount] = useState(0);
  const [DueAmount, SetDueAmount] = useState(0);
  const [Loan, setLoanCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      // Your data fetching logic here
      // fetchData();
      loadLoanHistory();
      setRefreshing(false);
    }, 2000);
  };

  // // Format date as YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fetch loan history from API
  const fetchLoanHistory = async (
    from: Date,
    to: Date
  ): Promise<LoanHistoryResponse> => {
    const fromDateStr = formatDateForAPI(from);
    const toDateStr = formatDateForAPI(to);

    const response = await fetch(
      `https://reiosglobal.com/srivarimob/api/loan-report?from_date=${fromDateStr}&to_date=${toDateStr}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const loadLoanHistory = async () => {
    try {
      const today = new Date();
      const data = await fetchLoanHistory(today, today);
      setTotalCollection(data.received_amount); // ✅ fixed
      // const receivedAmount = JSON.parse(localStorage.getItem('received_amount') || '0');
      // console.log("Loan History Data:", data);
    } catch (error) {
      console.error("Error fetching loan history:", error);
    }
  };

  // // Inside your component
  useEffect(() => {
    loadLoanHistory();
  }, [totalCollection]);

  // Function to fetch role
  const fetchRole = async () => {
    try {
      const storedRole = await AsyncStorage.getItem("role");
      setRole(storedRole);
    } catch (error) {
      console.error("Error fetching role:", error);
    }
  };

  // Function to fetch total loan dues
  const fetchTotalLoanDues = async () => {
    try {
      const response = await api.get("/totalloandue");
      setTotalCollection(response.data.total_due_amount || 0);
    } catch (error) {
      console.error("Error fetching total collection:", error);
    } finally {
      setLoading(false);
    }
  };

  // Functions to fetch other data
  const fetchCustomerCount = async () => {
    try {
      const response = await api.get("/customer-count");
      setCustomerCount(response.data.customer_count || 0);
    } catch (error) {
      console.error("Error fetching customer count:", error);
    }
  };

  const fetchEmployeeCount = async () => {
    try {
      const response = await api.get("/employee-count");
      setEmployeesCount(response.data.employee_count || 0);
    } catch (error) {
      console.error("Error fetching employee count:", error);
    }
  };

  // Separate function to fetch only loan count, called on focus
  const fetchLoanCount = async () => {
    try {
      const response = await api.get("/loans/count-pending-inprogress");
      setLoanCount(response.data.count || 0);
    } catch (error) {
      console.error("Error fetching loan count:", error);
    }
  };

  // Function to fetch loan dues info
  const fetchLoanData = async () => {
    try {
      const response = await api.get("/loan-due");
      SetDueAmount(response.data.total_due_amount || 0);
      const loanDetails = response.data.loan_details[0];
      setLoanCount(loanDetails?.loan_count || 0);
    } catch (error) {
      console.error("Error fetching loan data:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRole();
      fetchTotalLoanDues();
      fetchCustomerCount();
      fetchEmployeeCount();

      // Fetch loan count only when returning from certain pages
      // or based on your specific logic. For example, always fetch here:
      fetchLoanCount();

      const backAction = () => {
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          { text: "Cancel", onPress: () => null, style: "cancel" },
          { text: "Yes", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
      return () => subscription.remove();
    }, [])
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4299e1"]} // Android
          tintColor="#4299e1" // iOS
        />
      }
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.menuRow}></View>
        <Image
          source={require("@/assets/images/Srivari.png")}
          style={styles.logo}
        />
      </View>

      <View style={styles.container}>
        <View style={styles.cardListContainer}>
          {/* Loan Card */}
          <TouchableOpacity
            onPress={() => router.replace("ViewLoan" as never)}
            activeOpacity={0.8}
          >
            <View style={styles.card}>
              <FontAwesome name="university" style={styles.icon} />
              <Text style={styles.cardTitle}>Loans</Text>
              <Text style={styles.cardValue}>
                {Loan !== undefined ? Loan : 0}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Customers Card */}
          <TouchableOpacity
            onPress={() => router.replace("Customer" as never)}
            activeOpacity={0.8}
          >
            <View style={styles.card}>
              <FontAwesome name="users" style={styles.icon} />
              <Text style={styles.cardTitle}>Active Customers</Text>
              <Text style={styles.cardValue}>{CustomerCount || 0}</Text>
            </View>
          </TouchableOpacity>

          {/* Employees Card */}
          <TouchableOpacity
            onPress={() => {
              if (role !== "employee") {
                router.replace("Employees" as never);
              }
            }}
            activeOpacity={role !== "employee" ? 0.8 : 1}
            disabled={role === "employee"}
          >
            <View style={styles.card}>
              <FontAwesome name="briefcase" style={styles.icon} />
              <Text style={styles.cardTitle}>Employees</Text>
              <Text style={styles.cardValue}>{EmployeesCount || 0}</Text>
            </View>
          </TouchableOpacity>

          {/* Today's Gross Collection Card */}
          <TouchableOpacity
            onPress={() => router.replace("PendingList" as never)}
            activeOpacity={0.8}
          >
            <View style={styles.card}>
              <FontAwesome name="line-chart" style={styles.icon} />
              <Text style={styles.cardTitle}>
                Today&apos;s Gross Collection
              </Text>
              <Text style={styles.cardValue}>{totalCollection || 0}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07387A",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  container: {
    flex: 1,
    backgroundColor: "#07387A",
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#07387A",
  },
  cardListContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  card: {
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    width: "90%",
    borderRadius: 4,
    backgroundColor: "#E8B801",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    // borderWidth:1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#06387A",
    textAlign: "center",
    flex: 1,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#06387A",
    textAlign: "right",
    width: 120,
  },
  icon: {
    fontSize: 24,
    color: "#06387A",
    marginRight: 10,
  },
});

export default Home;
