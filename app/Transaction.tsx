import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import api from "./Api";

export interface Transaction {
  id: number;
  loan_id: string | number;
  user_name: string;
  user_id: string | number;
  employee_id: string | number;
  loan_amount: number;
  loan_date: string;
  due_amount: string;
  total_amount: number;
  status: string;
  paid_amount: number;
  due_date: string;
  pending_amount: number;
  payment_time: string;
  payment_status: string;
  payment_time_with_date: string;
  created_at_formatted: string;
  created_time_only: string;
}

// ✅ Common Date Formatter
const formatDate = (date: any) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d)) return "N/A";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`; // dd-mm-yyyy
};

// const formatDateTime = (date: any): string => {
//   if (!date) return "N/A";
//   const d = new Date(date);
//   if (isNaN(d.getTime())) return "N/A";

//   const day = String(d.getDate()).padStart(2, "0");
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const year = d.getFullYear();

//   const hours = String(d.getHours()).padStart(2, "0");
//   const minutes = String(d.getMinutes()).padStart(2, "0");

//   return `${day}-${month}-${year} ${hours}:${minutes}`; // dd-mm-yyyy HH:MM
// };

const Transaction = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Fetch data on mount
  useEffect(() => {
    getData();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get("/alltransaction");
      const data = response.data?.data || [];
      return data;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  };

  const getData = async () => {
    const data = await fetchTransactions();
    setTransactions(data);
  };

  // Filter transactions based on search
  const filtered = transactions.filter((row) => {
    const searchTerm = search.toLowerCase();
    return (
      row.loan_id?.toString().toLowerCase().includes(searchTerm) ||
      row.user_id?.toString().toLowerCase().includes(searchTerm) ||
      row.employee_id?.toString().toLowerCase().includes(searchTerm)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filtered.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Toggle expand/collapse for a card
  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {currentTransactions.length > 0 ? (
          currentTransactions.map((item) => (
            <View key={item.id} style={styles.cardContainer}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item.id)}
              >
                <View>
                  <Text style={styles.cardTitle}>
                    Customer Name: {item.user_name}
                  </Text>
                  <Text style={styles.cardSubTitle}>
                    Due Date: {formatDate(item.due_date)}
                    <Text> {item.created_time_only}</Text>
                  </Text>
                </View>
                <Text style={styles.expandIcon}>
                  {expandedIds.has(item.id) ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {expandedIds.has(item.id) && (
                <View style={styles.cardContent}>
                  <Text style={styles.cardText}>Loan ID: {item.loan_id}</Text>
                  <Text style={styles.cardText}>
                    User Name: {item.user_name}
                  </Text>
                  <Text style={styles.cardText}>User ID: {item.user_id}</Text>
                  <Text style={styles.cardText}>
                    Collection by: {item.employee_id}
                  </Text>
                  <Text style={styles.cardText}>
                    Loan Amount: ₹{item.loan_amount}
                  </Text>
                  <Text style={styles.cardText}>
                    Due Amount: ₹{item.due_amount}
                  </Text>
                  <Text style={styles.cardText}>
                    Paid Amount: ₹{item.paid_amount}
                  </Text>
                  <Text style={styles.cardText}>
                    Pending Amount: ₹{item.pending_amount}
                  </Text>
                  <Text style={styles.cardText}>
                    Loan Date: {formatDate(item.loan_date)}
                  </Text>
                  <Text style={styles.cardText}>
                    Due Date: {formatDate(item.due_date)}
                  </Text>
                  <Text style={styles.cardText}>
                    Total Amount: ₹{item.total_amount}
                  </Text>
                  <Text style={styles.cardText}>Status: {item.status}</Text>
                  <Text style={styles.cardText}>
                    Payment Status: {item.payment_status}
                  </Text>

                  {/* ✅ Properly formatted Payment Date & Time */}
                  <Text style={styles.cardText}>
                    Payment Day: {formatDate(item.created_at_formatted)}
                  </Text>
                  <Text style={styles.cardText}>
                    Payment Time: {item.payment_time}
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No matching records found.</Text>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={styles.paginationWrapper}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() =>
                currentPage > 1 && handlePageChange(currentPage - 1)
              }
            >
              <Text style={styles.arrowText}>←</Text>
            </TouchableOpacity>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(currentPage - page) <= 2
              )
              .map((page, index, array) => {
                const prev = array[index - 1];
                const showDots = prev && page - prev > 1;
                return (
                  <React.Fragment key={page}>
                    {showDots && <Text style={styles.dots}>...</Text>}
                    <TouchableOpacity
                      style={[
                        styles.pageButton,
                        currentPage === page && styles.activePageButton,
                      ]}
                      onPress={() => handlePageChange(page)}
                    >
                      <Text
                        style={[
                          styles.pageText,
                          currentPage === page && styles.activePageText,
                        ]}
                      >
                        {page}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}

            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() =>
                currentPage < totalPages && handlePageChange(currentPage + 1)
              }
            >
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#07387A" },
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
  contentContainer: { padding: 20 },
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
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  cardSubTitle: { fontSize: 12, color: "#444", marginTop: 4 },
  expandIcon: { fontSize: 18, color: "#555" },
  cardContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#0D1B2A",
  },
  cardText: { fontSize: 14, marginBottom: 8, color: "#fff" },
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
  arrowText: { fontSize: 18, color: "#fff" },
  pageButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activePageButton: { backgroundColor: "#F4C10F" },
  pageText: { color: "#333", fontWeight: "500" },
  activePageText: { color: "#fff", fontWeight: "bold" },
  dots: { color: "#999", fontSize: 18, marginHorizontal: 6 },
});

export default Transaction;
