import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Animated, Easing, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from "expo-router";

import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

type Loan = {
  loan_id: number;
  user_id: number;
  user_name: string;
  city: string;
  due_date: string;
  due_amount: string;
  pending_amount: string;
  paid_amount: string;
  status: string;
  collection_by: string;
  created_at: string;
  updated_at: string;
};

export default function DueList() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState('');
  const [error, setError] = useState('');
  const Navigation = useNavigation();

const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1); // from backend

const isFocused = useIsFocused();

  // Animated icon spin
  const spinValue = useRef(new Animated.Value(0)).current;

  const startSpinner = () => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopSpinner = () => {
    spinValue.stopAnimation();
  };

  useEffect(() => {
    if (loading) {
      startSpinner();
    } else {
      stopSpinner();
    }
  }, [loading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Fetch data on mount and date change
  useEffect(() => {
    fetchLoans();
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [selectedDate]);

  useEffect(() => {
  if (isFocused) {
    fetchLoans(1); // 👈 refresh data when screen is focused
  }
}, [isFocused]);

  const handleDateChange = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) setSelectedDate(date);
  };

  // const fetchLoans = async () => {
  //   try {
  //     setLoading(true);
  //     setError('');
  //     const dateStr = selectedDate.toISOString().split('T')[0];

  //     const response = await fetch(`http://192.168.141.45:8000/api/fetchCitiesWithDueLoansArray?date=${dateStr}`);
  //     const json = await response.json();

  //     if (response.ok) {
  //       setLoans(json.data);
  //       setSelectedDay(json.selected_day);
  //     } else {
  //       setLoans([]);
  //       setError(json.message || 'Something went wrong');
  //     }
  //   } catch (err) {
  //     setError('Failed to fetch data');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

const fetchLoans = async (requestedPage = 1) => {
  try {
    setLoading(true);
    setError('');
    const dateStr = selectedDate.toISOString().split('T')[0];
    const limit = 20;

    const response = await fetch(
      `https://reiosglobal.com/srivarimob/api/fetchCitiesWithDueLoansArray?date=${dateStr}&page=${requestedPage}&limit=${limit}`
    );
    const json = await response.json();

    if (response.ok) {
      const newData = json.data || [];

      if (requestedPage === 1) {
        setLoans(newData); // first page
      } else {
        setLoans(prev => [...prev, ...newData]); // append next pages
      }

      setPage(requestedPage);
      setTotalPages(Math.ceil(json.total / limit));
    } else {
      setError(json.message || 'Something went wrong');
    }
  } catch (err) {
    setError('Failed to fetch data');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchLoans(1);
}, [selectedDate]);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <View style={styles.container}>
      {/* Header with title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Due List Today!</Text>
      </View>

      {/* Date and Day display in a horizontal row */}
      <View style={styles.dateContainer}>
        <View style={styles.dateLeft}>
          <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
        </View>
        <View style={styles.dateRight}>
          <Text style={styles.dayText}>{selectedDay || selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}</Text>
        </View>
      </View>

      {/* Date picker button */}
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateButtonText}>Select Date</Text>
      </TouchableOpacity>
     {showPicker && (
  <DateTimePicker
    value={selectedDate}
    mode="date"
    display="default"
    minimumDate={new Date()} // disables past dates
    onChange={handleDateChange}
  />
)}

      {/* Loader with animated icon */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            {/* Custom loader icon with white color */}
            <Ionicons name="sync" size={50} color="#ffffff" />
          </Animated.View>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
  data={loans}
  keyExtractor={(item) => item.loan_id.toString()}
  renderItem={({ item }) => (
    <TouchableOpacity onPress={() => toggleExpand(item.loan_id)}>
      <View style={styles.card}>
        <Text style={styles.name}>{item.user_name} ({item.city})</Text>
        <Text style={styles.dueAmount}>Due: ₹{item.due_amount}</Text>
        {expandedId === item.loan_id && (
          <View style={styles.details}>
            <Text>Pending: ₹{item.pending_amount}</Text>
            <Text>Paid: ₹{item.paid_amount}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Collected By: {item.collection_by}</Text>
            <Text>Due Date: {item.due_date}</Text>
            <TouchableOpacity
              style={styles.viewDuesButton}
              onPress={() => Navigation.navigate('ViewLoanDue', { id: item.loan_id })}
            >
              <Text style={styles.viewDuesButtonText}>View Dues</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )}
   contentContainerStyle={{ paddingBottom: 100 }}
  onEndReachedThreshold={0.5}
  
  onEndReached={() => {
    if (page < totalPages && !loading) {
      fetchLoans(page + 1);
    }
  }}
/>

      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f3f', 
    padding: 16,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: '#003366', 
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dateLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  dateRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  dayText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  dateButton: {
   backgroundColor: "#F4C10F",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dueAmount: {
    fontSize: 14,
    marginTop: 4,
  },
  details: {
    marginTop: 8,
  },
  viewDuesButton: {
     backgroundColor: '#001f3f', 
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  viewDuesButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});