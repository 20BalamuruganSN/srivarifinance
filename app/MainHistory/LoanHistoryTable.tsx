import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

export interface LoanHistoryResponse {
  from_date: string;
  to_date: string;
  total_loans: number;
  total_amount: string;
  received_amount: string;
}

export interface LoanHistoryError {
  message: string;
}

interface LoanHistoryTableProps {
  data: LoanHistoryResponse;
}

const LoanHistoryTable: React.FC<LoanHistoryTableProps> = ({ data }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // ✅ Format Date: DD-MM-YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // ✅ Format Amount with Indian Rupee symbol ₹
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  if (isMobile) {
    return (
      <View style={styles.mobileContainer}>
        <View style={styles.mobileHeader}>
          <Text style={styles.mobileHeaderText}>Loan History Details</Text>
        </View>
        <View style={styles.mobileContent}>
          <View style={styles.mobileRow}>
            <Text style={styles.mobileLabel}>From Date:</Text>
            <Text style={styles.mobileValue}>{formatDate(data.from_date)}</Text>
          </View>
          <View style={styles.mobileRow}>
            <Text style={styles.mobileLabel}>To Date:</Text>
            <Text style={styles.mobileValue}>{formatDate(data.to_date)}</Text>
          </View>
          <View style={styles.mobileRow}>
            <Text style={styles.mobileLabel}>Total Loans:</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{data.total_loans}</Text>
            </View>
          </View>
          <View style={styles.mobileRow}>
            <Text style={styles.mobileLabel}>Total Amount:</Text>
            <Text style={styles.mobileValue}>{formatAmount(data.total_amount)}</Text>
          </View>
          <View style={styles.mobileRow}>
            <Text style={styles.mobileLabel}>Received Amount:</Text>
            <Text style={styles.mobileValue}>{formatAmount(data.received_amount)}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.desktopContainer}>
      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>From Date</Text>
        <Text style={styles.headerCell}>To Date</Text>
        <Text style={styles.headerCell}>Total Loans</Text>
        <Text style={styles.headerCell}>Total Amount</Text>
        <Text style={styles.headerCell}>Received Amount</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.cell}>{formatDate(data.from_date)}</Text>
        <Text style={styles.cell}>{formatDate(data.to_date)}</Text>
        <Text style={styles.cell}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{data.total_loans}</Text>
          </View>
        </Text>
        <Text style={[styles.cell, styles.amountCell]}>{formatAmount(data.total_amount)}</Text>
        <Text style={[styles.cell, styles.amountCell]}>{formatAmount(data.received_amount)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  desktopContainer: {
    backgroundColor: '#0D1B2A',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#14274E',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    flex: 1,
    color: '#F4C10F',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3C97',
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  amountCell: {
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#F4C10F',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  mobileContainer: {
    backgroundColor: '#0D1B2A',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  mobileHeader: {
    backgroundColor: '#14274E',
    padding: 16,
  },
  mobileHeaderText: {
    color: '#F4C10F',
    fontSize: 18,
    fontWeight: '600',
  },
  mobileContent: {
    padding: 16,
  },
  mobileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3C97',
  },
  mobileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E0E0E0',
  },
  mobileValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LoanHistoryTable;
