import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Image,
  BackHandler, Alert, StatusBar, TouchableOpacity
} from 'react-native';
// import { UIActivityIndicator } from "react-native-indicators";
import api from './Api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = () => {
  const router = useRouter(); 
  const [totalCollection, setTotalCollection] = useState(0);
  const [EmployeesCount, setEmployeesCount] = useState(0);
  const [CustomerCount, setCustomerCount] = useState(0);
  const [DueAmount, SetDueAmount] = useState(0);
  const [Loan, setLoanCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null); // Added role state

  const animations = {
    loanCard: useState(new Animated.Value(200))[0],
    customerCard: useState(new Animated.Value(200))[0],
    employeeCard: useState(new Animated.Value(200))[0],
    dueAmountCard: useState(new Animated.Value(200))[0],
    totalCollectionCard: useState(new Animated.Value(200))[0],
  };

  // Load role and data on focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRole(); // Fetch role from AsyncStorage
      fetchLoanData();
      fetchLoanCount();
      fetchCustomerCount();
      fetchEmployeeCount();
      fetchTotalLoanDues();

      const backAction = () => {
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          { text: "Cancel", onPress: () => null, style: "cancel" },
          { text: "Yes", onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);
      return () => subscription.remove();
    }, [])
  );

  // Fetch role from AsyncStorage
  const fetchRole = async () => {
    try {
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);
    } catch (error) {
      console.error('Error fetching role:', error);
    }
  };

  useEffect(() => {
    if (!loading) {
      Animated.stagger(1000, Object.values(animations).map(anim =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      )).start();
    }
  }, [loading]);

  const fetchLoanData = async () => {
    try {
      const response = await api.get('/loan-due');
      SetDueAmount(response.data.total_due_amount || 0);
      const loanDetails = response.data.loan_details[0];
      setLoanCount(loanDetails?.loan_count || 0);
    } catch (error) {
      console.error('Error fetching loan data:', error);
    }
  };

  const fetchLoanCount = async () => {
    try {
      const response = await api.get('/loans/count-pending-inprogress');
      setLoanCount(response.data.count || 0);
    } catch (error) {
      console.error("Error fetching loan count:", error);
    }
  };

  const fetchCustomerCount = async () => {
    try {
      const response = await api.get('/customer-count');
      setCustomerCount(response.data.customer_count || 0);
    } catch (error) {
      console.error("Error fetching customer count:", error);
    }
  };

  const fetchEmployeeCount = async () => {
    try {
      const response = await api.get('/employee-count');
      setEmployeesCount(response.data.employee_count || 0);
    } catch (error) {
      console.error('Error fetching employee count:', error);
    }
  };

  const fetchTotalLoanDues = async () => {
    try {
      const response = await api.get('/totalloandue');
      setTotalCollection(response.data.total_due_amount || 0);
    } catch (error) {
      console.error("Error fetching total collection:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.menuRow}>
          {/* Optional menu button */}
        </View>
        <Image
          source={require('@/assets/images/Srivari.png')}
          style={styles.logo}
        />
      </View>

      <View style={styles.container}>
        <View style={styles.cardListContainer}>

          {/* Loan Card */}
          <TouchableOpacity
            onPress={() => router.replace('ViewLoan' as never)}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.card, { transform: [{ translateY: animations.loanCard }] }]}>
              <FontAwesome name="university" style={styles.icon} />
              <Text style={styles.cardTitle}>Loans</Text>
              <Text style={styles.cardValue}>{Loan !== undefined ? Loan : 0}</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Customers Card */}
          <TouchableOpacity
            onPress={() => router.replace('Customer' as never)}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.card, { transform: [{ translateY: animations.customerCard }] }]}>
              <FontAwesome name="users" style={styles.icon} />
              <Text style={styles.cardTitle}>Customers</Text>
              <Text style={styles.cardValue}>{CustomerCount || 0}</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Employees Card - Only clickable if not role 'employee' */}
          <TouchableOpacity
            onPress={() => {
              if (role !== 'employee') {
                router.replace('Employees' as never);
              }
            }}
            activeOpacity={role !== 'employee' ? 0.8 : 1} 
            disabled={role === 'employee'} 
          >
            <Animated.View style={[styles.card, { transform: [{ translateY: animations.employeeCard }] }]}>
              <FontAwesome name="briefcase" style={styles.icon} />
              <Text style={styles.cardTitle}>Employees</Text>
              <Text style={styles.cardValue}>{EmployeesCount || 0}</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Total Collection Card */}
          <TouchableOpacity
            onPress={() => router.replace('PendingList' as never)}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.card, { transform: [{ translateY: animations.totalCollectionCard }] }]}>
              <FontAwesome name="line-chart" style={styles.icon} />
              <Text style={styles.cardTitle}>Total Collection</Text>
              <Text style={styles.cardValue}>{totalCollection || 0}</Text>
            </Animated.View>
          </TouchableOpacity>

        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
  },

  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center", alignItems: "center", zIndex: 1000,
  },
  headerContainer: {
    // paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#07387A',
  },
  logo: {
    width: 120, height: 120,
    resizeMode: 'contain',
  },
  container: {
    flex: 1,
    backgroundColor: '#07387A',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#07387A',
  },
  cardListContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  card: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    width: '90%',
    borderRadius: 4,
    backgroundColor: '#E8B801',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#06387A',
    textAlign: 'center',
    flex: 1,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#06387A',
    textAlign: 'right',
    width: 120,
  },
  icon: {
    fontSize: 24,
    color: '#06387A',
    marginRight: 10,
  },
});

export default Home;