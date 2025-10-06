import React, { useState } from "react";
import {
  Text,
  View,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { useRoute } from "@react-navigation/native";
import api from "./Api";
import { useFocusEffect } from "@react-navigation/native";

function ViewCustomer() {
  const route = useRoute();
  const { id, city } = route.params as { id: string; city: string };
  const [customerData, setCustomerData] = useState<any>(null);
  const [loanData, setLoanData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const formatDate = (date: any) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d)) return "N/A";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`; // dd-mm-yyyy
};


  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
          // 🔹 Step 1: Fetch all loans
          const loanResponse = await api.get(`/loans`);
          const loans = loanResponse.data.loans;

          // console.log("👉 All loans:", loans.map((l: any) => l.loan_id));

          // Loan id ku match aana loan ah eduthu
          const foundLoan = loans.find(
            (loan: any) =>
              String(loan.loan_id)?.trim().toLowerCase() ===
              String(id)?.trim().toLowerCase()
          );

          // console.log("✅ Found Loan:", foundLoan);

          if (!foundLoan) {
            setError("No loan data found.");
            setLoading(false);
            return;
          }

          setLoanData([foundLoan]); // oru loan mattum thaan varum nu vachuklam

          // 🔹 Step 2: Get the user_id from loan
          const userId = foundLoan.user_id;
          // console.log("👉 Found User ID:", userId);

          // 🔹 Step 3: Fetch all customers
          const customerResponse = await api.get(`/customer`);
          const customers = customerResponse.data;

          const foundCustomer = customers.find(
            (customer: any) =>
              String(customer.user_id)?.trim().toLowerCase() ===
              String(userId)?.trim().toLowerCase()
          );

          // console.log("✅ Found Customer:", foundCustomer);

          if (!foundCustomer) {
            setError("No customer data found.");
            setLoading(false);
            return;
          }

          setCustomerData(foundCustomer);
        } catch (error) {
          console.error("Error fetching data:", error);
          setError("Failed to load data.");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [id])
  );

  if (loading) {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color="#F4C10F" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!customerData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No customer data found.</Text>
      </View>
    );
  }

  // Default image URL for placeholder
  const defaultImageUri = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

  // Function to decide image source
  const getImageSource = (uri?: string) => {
    return uri && uri.trim() !== "" ? { uri } : { uri: defaultImageUri };
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Customer Details</Text>
        </View>

        {/* <View style={styles.profileSection}>
          <Text style={styles.sectionLabel}>Profile Photo</Text>
          <View style={styles.imageContainer}>
            <Image
              source={getImageSource(customerData.profile_photo)}
              style={styles.profileImage}
            />
          </View>
        </View> */}

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>ID:</Text>
            <Text style={styles.infoText}>{customerData.user_id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.infoText}>{customerData.user_name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.infoText, 
              customerData.status === 'active' ? styles.activeStatus : styles.inactiveStatus
            ]}>
              {customerData.status}
            </Text>
          </View>
        </View>

        {/* Loan Details Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Loan Details</Text>
        </View>

        {loanData.length > 0 ? (
          loanData.map((loan, index) => (
            <View key={index} style={styles.loanCard}>
              <View style={styles.detailRow}>
                <Text style={styles.loanLabel}>Loan ID:</Text>
                <Text style={styles.loanText}>{loan.loan_id}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.loanLabel}>Customer Name:</Text>
                <Text style={styles.loanText}>{loan.customer_name}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.loanLabel}>City:</Text>
                <Text style={styles.loanText}>{loan.city}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.loanLabel}>Loan Amount:</Text>
                <Text style={styles.loanText}>₹{loan.loan_amount}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.loanLabel}>Tenure (months):</Text>
                <Text style={styles.loanText}>{loan.tenure_month}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.loanLabel}>Interest Percentage:</Text>
                <Text style={styles.loanText}>{loan.interest_percentage}%</Text>
              </View>

            <View style={styles.detailRow}>
  <Text style={styles.loanLabel}>Loan Date:</Text>
  <Text style={styles.loanText}>
    {loan.loan_date ? formatDate(loan.loan_date) : "N/A"}
  </Text>
</View>


              <View style={styles.detailRow}>
                <Text style={styles.loanLabel}>Total Amount:</Text>
                <Text style={styles.loanText}>₹{loan.total_amount}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.loanLabel}>Due Amount:</Text>
                <Text style={styles.loanText}>₹{loan.due_amount}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.loanLabel}>Status:</Text>
                <Text style={[
                  styles.loanText,
                  loan.status === 'active' ? styles.activeStatus : styles.inactiveStatus
                ]}>
                  {loan.status}
                </Text>
              </View>

              {/* Vehicle Photos */}
              {loan.vehicle_exterior_photo_front_base64 && (
                <View style={styles.photoSection}>
                  <Text style={styles.loanLabel}>Vehicle Front Photo:</Text>
                  <Image
                    source={getImageSource(loan.vehicle_exterior_photo_front_base64)}
                    style={styles.loanImage}
                  />
                </View>
              )}
              
              {loan.vehicle_exterior_photo_back_base64 && (
                <View style={styles.photoSection}>
                  <Text style={styles.loanLabel}>Vehicle Back Photo:</Text>
                  <Image
                    source={getImageSource(loan.vehicle_exterior_photo_back_base64)}
                    style={styles.loanImage}
                  />
                </View>
              )}
              
              {loan.vehicle_exterior_photo_left_base64 && (
                <View style={styles.photoSection}>
                  <Text style={styles.loanLabel}>Vehicle Left Photo:</Text>
                  <Image
                    source={getImageSource(loan.vehicle_exterior_photo_left_base64)}
                    style={styles.loanImage}
                  />
                </View>
              )}
              
              {loan.vehicle_exterior_photo_right_base64 && (
                <View style={styles.photoSection}>
                  <Text style={styles.loanLabel}>Vehicle Right Photo:</Text>
                  <Image
                    source={getImageSource(loan.vehicle_exterior_photo_right_base64)}
                    style={styles.loanImage}
                  />
                </View>
              )}

              {loan.engine_number_photo_base64 && (
                <View style={styles.photoSection}>
                  <Text style={styles.loanLabel}>Chassis Number Photo:</Text>
                  <Image
                    source={getImageSource(loan.engine_number_photo_base64)}
                    style={styles.loanImage}
                  />
                </View>
              )}
              
              {loan.image_base64 && (
                <View style={styles.photoSection}>
                  <Text style={styles.loanLabel}>Transaction Proof:</Text>
                  <Image
                    source={getImageSource(loan.image_base64)}
                    style={styles.loanImage}
                  />
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noLoansContainer}>
            <Text style={styles.noLoansText}>No loans found for this customer</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default ViewCustomer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 180,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffe6e6",
    padding: 20,
  },
  errorText: {
    color: "#d9534f",
    fontSize: 18,
    textAlign: "center",
    fontFamily: "Roboto-Medium",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  loadingText: {
    marginTop: 10,
    color: "#07387A",
    fontFamily: "Roboto-Medium",
  },
  headerContainer: {
    backgroundColor: "#07387A",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F4C10F",
    textAlign: "center",
    fontFamily: "Roboto-Bold",
  },
  profileSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#07387A",
    marginBottom: 10,
    fontFamily: "Roboto-Medium",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#F4C10F",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#F4C10F",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#07387A",
    fontFamily: "Roboto-Medium",
  },
  infoText: {
    fontSize: 16,
    color: "#555",
    fontFamily: "Roboto-Regular",
  },
  loanCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#07387A",
  },
  loanLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#07387A",
    marginTop: 8,
    fontFamily: "Roboto-Medium",
  },
  loanText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
    fontFamily: "Roboto-Regular",
  },
  loanImage: {
    width: "100%",
    height: 200,
    marginTop: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  noLoansContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noLoansText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    fontFamily: "Roboto-Italic",
  },
  photoSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  activeStatus: {
    color: "#28a745",
    fontWeight: "bold",
  },
  inactiveStatus: {
    color: "#dc3545",
    fontWeight: "bold",
  },
});