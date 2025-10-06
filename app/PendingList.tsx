import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, LayoutAnimation, Platform, UIManager, ScrollView, BackHandler } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useNavigationContainerRef } from 'expo-router';
import { useRouter } from 'expo-router';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Loan = {
  loan_id: number;
  user_id: number;
  user_name: string;
  city_name: string;
  next_amount: number;
  pending_amount: number;
  due_amount: number;
  paid_amount: number;
  due_date: string;
  paid_on: string | null;
  collection_by: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type LoanResponse = {
  total_loans: number;
  total_pending_amount: number;
  data: Loan[];
};

export default function PendingList() {
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const Navigation = useNavigation();

  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const navigationRef = useNavigationContainerRef(); 

  const [pendingLoans, setPendingLoans] = useState<LoanResponse | null>(null);
  const [unpaidLoans, setUnpaidLoans] = useState<LoanResponse | null>(null);

  const [expandedPendingIds, setExpandedPendingIds] = useState<Set<number>>(new Set());
  const [expandedUnpaidIds, setExpandedUnpaidIds] = useState<Set<number>>(new Set());

  // ✅ Format date to yyyy-mm-dd for backend
  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // ✅ Format date to dd-mm-yyyy for display
  const formatDateDisplay = (dateInput: string | Date) => {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const backAction = () => {
      if (canGoBack) {
        router.back();
      } else {
        router.replace("/");
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanGoBack(navigationRef.canGoBack());
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // API call function
  const fetchLoans = async () => {
    try {
      const response = await fetch(
        `https://reiosglobal.com/srivarimob/api/pending-loans-with-user-city`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from_date: formatDateForAPI(fromDate),
            to_date: formatDateForAPI(toDate),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Server error');
      }

      const json = await response.json();

      setPendingLoans(json.pending);
      setUnpaidLoans(json.unpaid);
    } catch (error:any) {
      alert('Error fetching data: ' + error.message);
    }
  };

  // Expand / Collapse handlers
  const togglePendingExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newSet = new Set(expandedPendingIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedPendingIds(newSet);
  };

  const toggleUnpaidExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newSet = new Set(expandedUnpaidIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedUnpaidIds(newSet);
  };

  // Render loan item
  const renderLoanItem = (
    item: Loan,
    expandedIds: Set<number>,
    toggleExpand: (id: number) => void,
    listType: 'pending' | 'unpaid'
  ) => {
    const expanded = expandedIds.has(item.loan_id);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => toggleExpand(item.loan_id)}
      >
        <Text style={styles.cardTitle}>{item.user_name} - {item.city_name}</Text>
        <Text style={styles.statusText}>Status: {item.status}</Text>
        <Text style={styles.dateText}>Due Date: {formatDateDisplay(item.due_date)}</Text>
        <Text style={styles.amountText}>Due Amount: ₹{(Number(item.due_amount) || 0).toFixed(2)}</Text>

        {expanded && (
          <View style={styles.expandedContent}>
            <Text>Loan ID: {item.loan_id}</Text>
            <Text>Next Amount: ₹{(Number(item.next_amount) || 0).toFixed(2)}</Text>
            <Text>Pending Amount: ₹{(Number(item.pending_amount) || 0).toFixed(2)}</Text>
            <Text>Paid Amount: ₹{(Number(item.paid_amount) || 0).toFixed(2)}</Text>
            <Text>Paid On: {item.paid_on ? formatDateDisplay(item.paid_on) : 'Not Paid Yet'}</Text>
            <Text>Collection By: {item.collection_by || '-'}</Text>
            <Text>Created At: {formatDateDisplay(item.created_at)}</Text>
            <Text>Updated At: {formatDateDisplay(item.updated_at)}</Text>

            <TouchableOpacity
              style={styles.viewDuesButton}
              onPress={() => Navigation.navigate('ViewLoanDue', { id: item.loan_id })}
            >
              <Text style={styles.viewDuesButtonText}>View Dues</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
    >
      {/* Date Range Pickers */}
      <View style={styles.dateRow}>
        <View style={styles.datePickerContainer}>
          <Text style={styles.label}>From Date:</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowFromPicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDateDisplay(fromDate)}</Text>
          </TouchableOpacity>
          {showFromPicker && (
            <DateTimePicker
              value={fromDate}
              mode="date"
              display="default"
              onChange={(_, date) => {
                setShowFromPicker(false);
                if (date) setFromDate(date);
              }}
              maximumDate={toDate}
            />
          )}
        </View>
        <View style={styles.datePickerContainer}>
          <Text style={styles.label}>To Date:</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowToPicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDateDisplay(toDate)}</Text>
          </TouchableOpacity>
          {showToPicker && (
            <DateTimePicker
              value={toDate}
              mode="date"
              display="default"
              onChange={(_, date) => {
                setShowToPicker(false);
                if (date) setToDate(date);
              }}
              minimumDate={fromDate}
            />
          )}
        </View>
      </View>

      {/* Fetch Button */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.customButton} onPress={fetchLoans}>
          <Text style={styles.buttonText}>Get Loans</Text>
        </TouchableOpacity>
      </View>

      {/* Pending Loans */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Pending Loans</Text>
        <Text style={styles.sectionSubtitle}>Total: {pendingLoans?.total_loans || 0}</Text>
        <Text style={styles.sectionSubtitle}>Total Pending Amount: ₹{pendingLoans?.total_pending_amount.toFixed(2) || 0}</Text>
        {pendingLoans?.data.length ? (
          <FlatList
            data={pendingLoans.data}
            keyExtractor={(item) => `pending-${item.loan_id}`}
            extraData={expandedPendingIds}
            renderItem={({ item }) =>
              renderLoanItem(item, expandedPendingIds, togglePendingExpand, 'pending')
            }
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.noData}>No pending loans for selected period</Text>
        )}
      </View>

      {/* Unpaid Loans */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Unpaid Loans</Text>
        <Text style={styles.sectionSubtitle}>Total: {unpaidLoans?.total_loans || 0}</Text>
        <Text style={styles.sectionSubtitle}>Total Unpaid Amount: ₹{unpaidLoans?.total_pending_amount.toFixed(2) || 0}</Text>
        {unpaidLoans?.data.length ? (
          <FlatList
            data={unpaidLoans.data}
            keyExtractor={(item) => `unpaid-${item.loan_id}`}
            extraData={expandedUnpaidIds}
            renderItem={({ item }) =>
              renderLoanItem(item, expandedUnpaidIds, toggleUnpaidExpand, 'unpaid')
            }
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.noData}>No unpaid loans for selected period</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#001f3f',
    padding: 16,
    paddingTop: 50,
    paddingBottom:160
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: '#003366',
    borderRadius: 8,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datePickerContainer: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#003366',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  dateButton: {
    backgroundColor: '#F4C10F',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonRow: {
    marginBottom: 30,
    alignItems: 'center',
  },
  customButton: {
    backgroundColor: '#F4C10F',
    paddingVertical: 8,
    paddingHorizontal: 55,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#e5e5e5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 4,
  },
  amountText: {
    fontSize: 14,
    marginBottom: 4,
  },
  expandedContent: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 8,
  },
  noData: {
    fontStyle: 'italic',
    color: '#555',
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
