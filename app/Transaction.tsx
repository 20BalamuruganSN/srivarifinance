import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import api from "./Api";

export interface Transaction {
  id: number;
  loan_id: string | number;
  loan_type?: string;
  user_name:string,
  user_id: string | number;
  employee_id: string | number;
  loan_amount: number;
  loan_date: string; // or Date if you parse it
  total_amount: number;
  status: string;
  loan_closed_date?: string; // nullable
  payment_status: string;
  created_at: string; // or Date
}

const Transaction = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
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
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  };

  const deleteTransaction = async (transactionId: number) => {
    try {
      await api.delete(`/transactions/${transactionId}`);
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return false;
    }
  };

  const getData = async () => {
    const data = await fetchTransactions();
    setTransactions(data);
  };

  const handleDelete = async () => {
    if (deleteId !== null) {
      const success = await deleteTransaction(deleteId);
      if (success) {
        setTransactions((prev) => prev.filter((t) => t.id !== deleteId));
      }
      setDeleteId(null);
      setModalVisible(false);
    }
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
        {/* Search Input */}
        {/* <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search by Loan ID, User ID or Employee ID"
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setCurrentPage(1); // Reset to first page on new search
          }}
        /> */}
        <ScrollView contentContainerStyle={styles.contentContainer}>

        {/* Transaction Cards List */}
        {currentTransactions.length > 0 ? (
          currentTransactions.map((item) => (
            <View key={item.id} style={styles.cardContainer}>
              {/* Card Header */}
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item.id)}
              >
                <Text style={styles.cardTitle}>Customer Name: {item.user_name}</Text>
                <Text style={styles.expandIcon}>
                  {expandedIds.has(item.id) ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {/* Card Content: show/hide based on expansion */}
              {expandedIds.has(item.id) && (
                <View style={styles.cardContent}>
                  <Text style={styles.cardText}>Loan ID: {item.loan_id}</Text>
                   <Text style={styles.cardText}>User Name: {item.user_name}</Text>
                  <Text style={styles.cardText}>User ID: {item.user_id}</Text>
                  <Text style={styles.cardText}>Employee ID: {item.employee_id}</Text>
                  <Text style={styles.cardText}>Loan Amount: ₹{item.loan_amount}</Text>
                  <Text style={styles.cardText}>Loan Date: {item.loan_date}</Text>
                  <Text style={styles.cardText}>Total Amount: ₹{item.total_amount}</Text>
                  <Text style={styles.cardText}>Status: {item.status}</Text>
                  <Text style={styles.cardText}>Loan Closed Date: {item.loan_closed_date || "-"}</Text>
                  <Text style={styles.cardText}>Payment Status: {item.payment_status}</Text>
                  <Text style={styles.cardText}>Created At: {item.created_at}</Text>

                  {/* Delete Button */}
                  {/* <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      setDeleteId(item.id);
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity> */}
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
    {/* Left Arrow */}
    <TouchableOpacity
      style={styles.arrowButton}
      onPress={() => currentPage > 1 && handlePageChange(currentPage - 1)}
    >
      <Text style={styles.arrowText}>←</Text>
    </TouchableOpacity>

    {/* Page Numbers */}
    {Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((page) =>
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

    {/* Right Arrow */}
    <TouchableOpacity
      style={styles.arrowButton}
      onPress={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
    >
      <Text style={styles.arrowText}>→</Text>
    </TouchableOpacity>
  </View>
)}


        {/* Delete Confirmation Modal */}
        {/* <Modal
          transparent
          visible={deleteId !== null}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                Are you sure you want to delete this transaction?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setDeleteId(null);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteConfirmButton]}
                  onPress={handleDelete}
                >
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal> */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07387A",
  },
    header: {
    padding:36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14274E',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    // textAlign:'center',
    bottom:-20,
    marginRight:100,
    // marginBottom: 10,
  },
  contentContainer: {
    padding: 20,
  },
  searchInput: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  expandIcon: {
    fontSize: 18,
    color: "#555",
  },
  cardContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    // backgroundColor: "#fafafa",
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
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 16,
  paddingHorizontal: 10,
  backgroundColor: '#fff',
  borderRadius: 20,
  marginVertical: 20,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
  elevation: 5,
},

arrowButton: {
  paddingHorizontal: 14,
  paddingVertical: 8,
  // backgroundColor: '#f0f0f0',
  backgroundColor: "#0D1B2A",
  borderRadius: 25,
  marginHorizontal: 4,
},

arrowText: {
  fontSize: 18,
  color: '#fff',
},

pageButton: {
  paddingHorizontal: 14,
  paddingVertical: 8,
  backgroundColor: '#f0f0f0',
  borderRadius: 20,
  marginHorizontal: 4,
},

activePageButton: {
  // backgroundColor: '#7b61ff',
    backgroundColor: "#F4C10F",
},

pageText: {
  color: '#333',
  fontWeight: '500',
},

activePageText: {
  color: '#fff',
  fontWeight: 'bold',
},

dots: {
  color: '#999',
  fontSize: 18,
  marginHorizontal: 6,
},

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: "#ccc",
  },
  deleteConfirmButton: {
    backgroundColor: "#ff4d4d",
  },
  modalButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
});

export default Transaction;