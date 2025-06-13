import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  ScrollView,
} from "react-native";

import { Asset } from 'expo-asset';
import AntDesign from "@expo/vector-icons/AntDesign";
import { Picker } from "@react-native-picker/picker";
import { Searchbar, Button } from "react-native-paper";
import { router, useNavigation } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

// import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';


import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

import api from "./Api";

interface LoanDetails {
  employee_id: any;
  loan_id: any;
  pending_amount: any;
  loan_amount: any;
  due_amount: any;
  duration: any;
  user_id: any;
  user_name: any;
  mobile_number: any;
  ref_name: any;
  alter_mobile_number: any;
  segment: any;
  VIN_number: any;
  vehicle_make: any;
  vehicle_model: any;
  year_of_manufacture: any;
  chassis_number: any;
}

const ExpandableListItem = () => {
  const [DATA, SETDATA] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loanDetails, setLoanDetails] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all"); 

  const navigation = useNavigation();

  const toggleExpand = async (id: any) => {
    if (expandedItemId === id) {
      setExpandedItemId(null);
      setLoanDetails(null);
    } else {
      setExpandedItemId(id);
      setLoading(true);
      setLoanDetails(null);
      try {
        const response = await api.get(`/loandetails/${id}`);
        let data;

        if (typeof response.data === "string") {
          const cleaned = response.data.replace(/^\/\/\s*/, "");
          data = JSON.parse(cleaned);
        } else {
          data = response.data;
        }

        setLoanDetails(data.loans || data);
      } catch (error: any) {
        console.error("Error Fetching Loan Details:", error.message);
        setLoanDetails(null);
      } finally {
        setLoading(false);
      }
    }
  };

const handleDelete = async (loanId) => {
  if (!window.confirm(`Are you sure you want to delete loan ID ${loanId}?`)) return;

  try {
    const response = await fetch(`http://192.168.1.42:8000/api/loans/${loanId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    let data = { message: 'No response body' };
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn("Non-JSON response body:", text);
      data = { message: text };
    }

    if (response.ok) {
      alert(data.message || 'Loan deleted successfully.');
    } else {
      alert(`Error: ${data.message || 'Failed to delete loan.'}`);
    }

  } catch (error) {
    console.error('Error deleting loan:', error);
    alert('Something went wrong. Please try again.');
  }
};


  const handleDownloadReceipt = async (loanId: any) => {
    try {
      const pdfBytes = await loadPdfTemplate();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const loanDetailsData = await fetchLoanDetails(loanId);
      populatePdf(pdfDoc, loanDetailsData, boldFont, regularFont);
      await saveOrSharePdf(pdfDoc);
      await logDownloadAction();
    } catch (error) {
      console.error('Error generating receipt:', error);
    }
  };

  const loadPdfTemplate = async () => {
    const pdfTemplate = require('@/assets/images/loan.pdf');
    const asset = Asset.fromModule(pdfTemplate);

    await asset.downloadAsync();

    if (!asset.localUri) {
      throw new Error("PDF asset localUri is null");
    }

    if (Platform.OS === 'web') {
      const response = await fetch(asset.localUri);
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } else {
      const existingPdfBytes = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return Uint8Array.from(atob(existingPdfBytes), (c) => c.charCodeAt(0));
    }
  };

  const fetchLoanDetails = async (loanId: any) => {
    const response = await api.post('/loan_receipt', { loan_id: loanId });
    let data;
    if (typeof response.data === "string") {
      const cleaned = response.data.replace(/^\/\/\s*/, "");
      data = JSON.parse(cleaned);
    } else {
      data = response.data;
    }
    if (response.status !== 200) {
      throw new Error('Failed to fetch loan details');
    }
    return response.data.data;
  };

  const populatePdf = (
    pdfDoc: PDFDocument,
    loanDetails: LoanDetails,
    boldFont: PDFFont,
    regularFont: PDFFont
  ) => {
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const { height } = page.getSize();

    // Draw title and address
    page.drawText('Sri Vari Finance', { x: 70, y: height - 50, size: 24, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('113A, Kariya Manicka Perumal Kovil Street, Melakadayanallur-627751.', { x: 70, y: height - 80, size: 14, font: regularFont, color: rgb(0, 0, 0) });
    page.drawText('Tel: +91 99621 92623 | Website: www.srivarifinance.in | CIN: S651979TN19BLC0068874.', { x: 70, y: height - 100, size: 14, font: regularFont, color: rgb(0, 0, 0) });

    const xOffset = 70;
    const yStart = height - 130;

    // Draw Loan Details
    const loanDetailsData = [
      { label: 'Branch', value: 'Kovilpatti Branch' },
      { label: 'Employee Number', value: loanDetails.employee_id || 'N/A' },
      { label: 'Loan Number', value: loanDetails.loan_id || 'N/A' },
      { label: 'Loan Amount', value: loanDetails.loan_amount || 'N/A' },
      { label: 'Due Amount', value: loanDetails.due_amount || 'N/A' },
      { label: 'Tenure', value: loanDetails.duration || 'N/A' },
    ];

    loanDetailsData.forEach((item, index) => {
      const yOffset = yStart - index * 20;
      page.drawText(item.label, { x: xOffset, y: yOffset, size: 14, font: regularFont, color: rgb(0,0,0) });
      page.drawText(String(item.value), { x: xOffset + 150, y: yOffset, size: 14, font: regularFont, color: rgb(0,0,0) });
    });

    // Customer Details
    const customerDetails = [
      { label: 'Customer No:', value: loanDetails.user_id || 'N/A' },
      { label: 'Customer Name:', value: loanDetails.user_name || 'N/A' },
      { label: 'Mobile Number:', value: loanDetails.mobile_number || 'N/A' },
      { label: 'Guarantor Name:', value: loanDetails.ref_name || 'N/A' },
      { label: 'Guarantor Mobile:', value: loanDetails.alter_mobile_number || 'N/A' },
    ];

    const customerYstart = yStart - (loanDetailsData.length * 20) - 30;
    customerDetails.forEach((item, index) => {
      const yOffset = customerYstart - index * 20;
      page.drawText(item.label, { x: xOffset, y: yOffset, size: 14, font: regularFont, color: rgb(0,0,0) });
      page.drawText(item.value, { x: xOffset + 150, y: yOffset, size: 14, font: regularFont, color: rgb(0,0,0) });
    });

    // Vehicle Details
    const vehicleDetails = [
      { label: 'Segment', value: loanDetails.segment || 'N/A' },
      { label: 'Vehicle Number', value: loanDetails.VIN_number || 'N/A' },
      { label: 'Make', value: loanDetails.vehicle_make || 'N/A' },
      { label: 'Model', value: loanDetails.vehicle_model || 'N/A' },
      { label: 'Year of Manufacture', value: loanDetails.year_of_manufacture || 'N/A' },
      { label: 'Chassis Number', value: loanDetails.chassis_number || 'N/A' },
    ];

    const vehicleYstart = customerYstart - customerDetails.length * 20 - 30;
    vehicleDetails.forEach((item, index) => {
      const yOffset = vehicleYstart - index * 20;
      page.drawText(item.label, { x: xOffset, y: yOffset, size: 14, font: regularFont, color: rgb(0,0,0) });
      page.drawText(item.value, { x: xOffset + 150, y: yOffset, size: 14, font: regularFont, color: rgb(0,0,0) });
    });

    // Footer
    const footerY = 50;
    page.drawText('Sri Vari Finance', { x: 250, y: footerY, size: 14, font: regularFont, color: rgb(0,0,0) });
    page.drawText('Authority Signatory', { x: 250, y: footerY - 20, size: 12, font: regularFont, color: rgb(0,0,0) });
  };

  const saveOrSharePdf = async (pdfDoc: PDFDocument) => {
    const pdfBytes = await pdfDoc.save();
    if (Platform.OS === 'web') {
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Loan_Details.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const base64PDF = arrayBufferToBase64(pdfBytes);
      const fileUri = FileSystem.documentDirectory + 'Loan_Details.pdf';
      await FileSystem.writeAsStringAsync(fileUri, base64PDF, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(fileUri);
    }
  };

  const logDownloadAction = async () => {
    let userId;
    if (Platform.OS === 'web') {
      userId = localStorage.getItem('userid');
    } else {
      userId = await AsyncStorage.getItem('userid');
    }

    if (!userId) {
      console.error('User ID is missing. Cannot log the action.');
      return;
    }

    const isoDate = new Date().toISOString();
    const now = isoDate.slice(0, 19).replace('T', ' ');

    await api.post('/download_loan_receipt', {
      table_name: 'loan_due',
      modified_data: { receipt_type: 'Loan_Details' },
      modified_on: now,
      modified_by: userId,
    });
  };

  const arrayBufferToBase64 = (buffer: Iterable<number>) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const handleStatusChange = async (value: any, loan_id: any) => {
    setLoading(true);
    try {
      const storedUserId = localStorage.getItem("userid");
      await api.put(`loans/${loan_id}/status`, {
        employee_id: storedUserId,
        status: value,
      });
      setVisible(true);
    } catch (error: any) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  // ----------- Filter Logic -----------
  const filteredData = DATA.filter((item: any) => {
    // Filter by search
 const matchesSearch =
  (typeof item.loan_id === "string" &&
    item.loan_id.toLowerCase().includes(search.toLowerCase())) ||
  (typeof item.customer_name === "string" &&
    item.customer_name.toLowerCase().includes(search.toLowerCase()));

    // Filter by status
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "inprogress") return matchesSearch && item.status === "inprogress";
    if (filterStatus === "pending") return matchesSearch && item.status === "pending";
    if (filterStatus === "preclose") return matchesSearch && item.status === "preclose";
    if (filterStatus === "completed") return matchesSearch && item.status === "completed";

    return false;
  });

  // Fetch data on focus
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await api.get("/loans");
          if (Array.isArray(response.data.loans)) {
            SETDATA(response.data.loans);
          }
        } catch (error: any) {
          console.error("Error fetching Loan data:", error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [])
  );



 

// API call to get loan details from backend
const fetchLoanDetail = async (loanId) => {
  try {
    const response = await fetch(`http://192.168.1.20:8000/api/loandetails/${loanId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    

    if (!response.ok) {
      throw new Error('Loan not found');
    }

    const data = await response.json();
    return data.loans; // Assuming your backend returns { loan: { ... } }
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
};


return (
  <View style={styles.container}>

  
    {/* Header with Search & Filters */}
    <View style={styles.headerContainer}>
      <Searchbar
        placeholder="Search by Loan ID or Name"
        onChangeText={setSearch}
        style={styles.search}
        value={search}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("Loan" as never)}
      >
        <AntDesign name="addusergroup" size={24} color="#fff" />
      </TouchableOpacity>
    </View>

    {/* Filter Buttons */}
    <View style={styles.filterButtonsContainer}>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.filterButtonsContent}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === "all" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterStatus("all")}
        >
          <Text style={styles.filterButtonText}>All Loans</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === "inprogress" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterStatus("inprogress")}
        >
          <Text style={styles.filterButtonText}>In Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === "pending" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterStatus("pending")}
        >
          <Text style={styles.filterButtonText}>Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === "preclose" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterStatus("preclose")}
        >
          <Text style={styles.filterButtonText}>Preclosed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === "completed" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterStatus("completed")}
        >
          <Text style={styles.filterButtonText}>Completed</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>

    {/* List of Loans */}
    <FlatList
      data={filteredData}
      keyExtractor={(item) => item.loan_id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Loan Found</Text>
        </View>
      }
    />
  </View>
);


  // ----------- Render Item Function -----------

  function renderItem({ item }: { item: any }) {
    const isExpanded = expandedItemId === item.loan_id;
    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.itemHeader}
          onPress={() => toggleExpand(item.loan_id)}
        >
<View style={styles.iconContainer}>
{/* <TouchableOpacity
  style={styles.iconButton}
  onPress={async () => {
    const loanId = item?.loan_id ?? '';
    if (loanId) {
      const loanData = await fetchLoanDetail(loanId);
      if (loanData) {
        router.push({
          pathname: "/EditLoan",
          params: { loanData: JSON.stringify(loanData) },
        });
      } else {
        console.warn('Loan data not found');
      }
    } else {
      console.warn('Invalid loanId:', loanId);
    }
  }}
>
  <Ionicons name="pencil" size={24} color="#4CAF50" />
</TouchableOpacity> */}
</View>


          <View style={styles.itemRow}>
            <Text style={styles.itemTitle}>{item.loan_id}</Text>
            <Text style={styles.itemTitle}>{item.customer_name}</Text>
          </View>
          <Text style={styles.arrow}>{isExpanded ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {isExpanded && loanDetails && (
          <View style={styles.detailsContainer}>
            {/* Customer Info */}
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Customer ID</Text>
              <Text style={styles.detailsText}>{loanDetails?.user_id || "N/A"}</Text>
            </View>

             <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Customer Name</Text>
              <Text style={styles.detailsText}>{loanDetails?.customer_name || "N/A"}</Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Loan ID</Text>
              <Text style={styles.detailsText}>{loanDetails.loan_id || "N/A"}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Loan Amount</Text>
              <Text style={styles.detailsText}>{loanDetails.loan_amount || "N/A"}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Loan Close Date</Text>
              <Text style={styles.detailsText}>{loanDetails.loan_date || "N/A"}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Email</Text>
              <Text style={styles.detailsText}>{loanDetails.email || "N/A"}</Text>
            </View>

            {/* Status Picker */}
          <View style={styles.statusRow}>
  <Text style={styles.detailsLabel}>Status</Text>
  
  <View style={styles.pickerWrapper}>
    <Picker
      selectedValue={loanDetails.status}
      style={styles.picker}
      onValueChange={(value) => handleStatusChange(value, loanDetails.loan_id)}
      dropdownIconColor="#fff" // optional, white arrow
    >
      <Picker.Item label="Select Status" value="" />
      <Picker.Item label="Pending" value="pending" />
      <Picker.Item label="In Progress" value="inprogress" />
      <Picker.Item label="Completed" value="completed" />
      <Picker.Item label="Cancelled" value="cancelled" />
      <Picker.Item label="Preclose" value="preclose" />
    </Picker>
  </View>
</View>

            {/* Feedback / Notification */}
            {visible && (
              <View style={styles.popup}>
                <Text style={styles.popupText}>Status Changed!</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.btnContainer}>
              <Button
                mode="contained"
                style={styles.viewBtn}
                onPress={() => navigation.navigate("ViewLoanDue",{ id: loanDetails.loan_id })}
              >
                View Dues
              </Button>
              <TouchableOpacity
                style={styles.downloadIcon}
                onPress={() => handleDownloadReceipt(loanDetails.loan_id)}
              >
                <MaterialIcons name="file-download" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }
};

export default ExpandableListItem;

//  Styles 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07387A",
    padding: 10,
  },

   overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  // Header & Filter
  headerContainer: {

    marginBottom: 15,
  },
  search: {
    backgroundColor: "#fff",
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  addButton: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#F4C10F",
    padding: 12,
    borderRadius: 50,
    elevation: 4,
  },
  filterButtonsContent: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 10,
  gap: 10, 
},

  filterButtonsContainer: {
    flexDirection: "row",
    // flexWrap: "wrap",
    justifyContent: "space-evenly",
    marginTop: 15,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F4C10F",
    marginVertical: 5,
    minWidth: 80,
    alignItems: "center",
  },
  filterButtonActive: {
      backgroundColor: "#0D1B2A",
      borderColor:'white',
      borderWidth:1
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // List & Items

  iconContainer: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  gap: 12, // if using React Native 0.71+, otherwise use margin
  marginTop: 8,
},

iconButton: {
  backgroundColor: '#f0f0f0',
  padding: 8,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  elevation: 2, // Android shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
},


  deleteButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    marginTop:30,
    paddingBottom: 20,
  },
  itemContainer: {
    marginBottom: 12,
    backgroundColor: "#14274E",
    borderRadius: 15,
    padding: 15,
    elevation: 4,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemRow: {
    flexDirection: "row",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginRight: 15,
  },
  arrow: {
    fontSize: 18,
    color: "#fff",
  },

  // Details inside expanded item
  detailsContainer: {
    marginTop: 12,
    backgroundColor: "#243B55",
    borderRadius: 10,
    padding: 12,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  detailsText: {
    fontSize: 14,
    color: "#fff",
  },
  // statusRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   marginTop: 8,
  // },
  // picker: {
  //   flex: 1,
  //   height: 40,
  //   marginLeft: 10,
  //   borderRadius: 20,
  //   backgroundColor: "#fff",
  // },

  statusRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 8,
},

pickerWrapper: {
  flex: 1,
  height: 40,
  marginLeft: 10,
  borderRadius: 20,
  backgroundColor: "black",
  overflow: "hidden", 
  justifyContent: "center",
},

picker: {
  color: "white", 
  marginLeft: 10,
},

  // Buttons & Feedback
  popup: {
    marginTop: 10,
    backgroundColor: "#07387A",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  popupText: {
    color: "#fff",
    fontSize: 14,
  },
  btnContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  viewBtn: {
    backgroundColor: "#F4C10F",
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  downloadIcon: {
    backgroundColor: "#0D1B2A",
    padding: 8,
    borderRadius: 50,
    elevation: 2,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 200,
  },
  emptyText: {
    fontSize: 16,
    color: "#fff",
  },
});