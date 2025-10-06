import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather as FileText } from '@expo/vector-icons';
import DateFilter from './DateFilter';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import LoanHistoryTable from './LoanHistoryTable';

interface LoanHistoryResponse {
  from_date: string;
  to_date: string;
  total_loans: number;
  total_amount: string;
  received_amount: string;
}

const LoanHistoryPage: React.FC = () => {
  const currentDate = new Date();
  const defaultFromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // First day of current month
  const [fromDate, setFromDate] = useState<Date>(defaultFromDate);
  const [toDate, setToDate] = useState<Date>(currentDate);
  const [data, setData] = useState<LoanHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchLoanHistory = async (from: Date, to: Date): Promise<LoanHistoryResponse> => {
    const fromDateStr = formatDateForAPI(from);
    const toDateStr = formatDateForAPI(to);

    const response = await fetch(
      `https://reiosglobal.com/srivarimob/api/loan-report?from_date=${fromDateStr}&to_date=${toDateStr}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const fetchData = async (from?: Date, to?: Date) => {
    try {
      setLoading(true);
      setError(null);
      const responseData = await fetchLoanHistory(from || fromDate, to || toDate);
      setData(responseData);
    } catch (err) {
      console.error('Error fetching loan history:', err);
      setError(
        err instanceof Error 
          ? `Failed to load loan history: ${err.message}`
          : 'An unexpected error occurred while loading loan history.'
      );
    } finally {
      setLoading(false);
    }
  };

  const refetch = (from?: Date, to?: Date) => {
    fetchData(from, to);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFromDateChange = (date: Date) => {
    setFromDate(date);
  };

  const handleToDateChange = (date: Date) => {
    setToDate(date);
  };

  const handleFilterClick = () => {
    refetch(fromDate, toDate);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Loan History</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Date Filter with Filter Button */}
        <DateFilter 
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={handleFromDateChange}
          onToDateChange={handleToDateChange}
          onFilterClick={handleFilterClick}
        />

        {loading && <LoadingSpinner />}
        
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={() => refetch(fromDate, toDate)}
          />
        )}
        
        {data && !loading && !error && (
          <LoanHistoryTable data={data} />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07387A",
  },
  header: {
    padding: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#14274E",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    bottom: -20,
    marginRight: 100,
  },
  contentContainer: {
    padding: 20,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 20,
  },
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#F4C10F",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  cardSubTitle: {
    fontSize: 12,
    color: "#444",
    marginTop: 4,
  },
  expandIcon: {
    fontSize: 18,
    color: "#555",
  },
  cardContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#0D1B2A",
  },
  cardText: {
    fontSize: 14,
    marginBottom: 8,
    color: "#fff",
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noDataText: {
    textAlign: "center",
    marginVertical: 30,
    fontSize: 16,
    color: "#777",
  },
  paginationWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  arrowButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#0D1B2A",
    borderRadius: 25,
    marginHorizontal: 4,
  },
  arrowText: {
    fontSize: 18,
    color: "#fff",
  },
  pageButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activePageButton: {
    backgroundColor: "#F4C10F",
  },
  pageText: {
    color: "#333",
    fontWeight: "500",
  },
  activePageText: {
    color: "#fff",
    fontWeight: "bold",
  },
  dots: {
    color: "#999",
    fontSize: 18,
    marginHorizontal: 6,
  },
});

export default LoanHistoryPage;