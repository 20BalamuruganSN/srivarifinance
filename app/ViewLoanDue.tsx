import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Platform,
} from "react-native";
import api from "./Api";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { MaterialIcons, SimpleLineIcons } from "@expo/vector-icons";
import { Buffer } from "buffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRoute } from "@react-navigation/native";
// import { UIActivityIndicator } from "react-native-indicators";
// import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from "expo-router";
import { Button } from "react-native-paper";
import { Asset } from 'expo-asset';


// import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';


const ExpandableListItem = () => {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const route = useRoute();
  const { id } = route.params as { id: string };
  const navigation = useNavigation<any>();
  const toggleExpand = (itemId: any) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };



  const handleDownloadLoanDueReceipt = async (loanId: any, dueDate: any) => {
    try {
      console.log('Starting receipt generation for Loan ID:', loanId);

      // Load PDF template
      const pdfBytes = await loadPdfTemplate();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Fetch loan details
      const loanDetails = await fetchLoanDetails(loanId, dueDate);
      console.log("loanDetails&&&&&&&&&&&&", loanDetails);

      // Populate PDF with loan details
      populatePdf(pdfDoc, loanDetails, boldFont, regularFont, loanId);

      // Save or share the PDF
      await saveOrSharePdf(pdfDoc);

      // Log the download action
      await logDownloadAction();

      console.log('Receipt generated and downloaded successfully');
    } catch (error) {
      console.error('Error generating receipt:', error);
    }
  };

  const loadPdfTemplate = async () => {
    const pdfTemplate = require('@/assets/images/loan.pdf');
    const asset = Asset.fromModule(pdfTemplate);
    await asset.downloadAsync();
    const existingPdfBytes = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return Uint8Array.from(atob(existingPdfBytes), (c) => c.charCodeAt(0));
  };

  const fetchLoanDetails = async (loanId: any, dueDate: any) => {
    const response = await api.post('/loan_due_receipt', { loan_id: loanId, due_date: dueDate });
    if (response.status !== 200) {
      throw new Error('Failed to fetch loan details');
    }
    return response.data;
  };

  const populatePdf = (pdfDoc: PDFDocument, loanDetails: { user_name: any; paid_amount: any; employee_number: any; }, boldFont: PDFFont, regularFont: PDFFont, loanId: any) => {
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const { height } = page.getSize();

    // Draw title and address
    page.drawText('Sri Vari Finance', { x: 70, y: height - 300, size: 24, font: boldFont });
    page.drawText('113A, Kariya Manicka Perumal Kovil Street, Melakadayanallur-627751.', { x: 70, y: height - 330, size: 14, font: regularFont });
    page.drawText('Tel: +91 99621 92623 | Website: www.srivarifinance.in | CIN: S651979TN19BLC0068874.', { x: 70, y: height - 350, size: 14, font: regularFont });


    console.log("loanDetails", loanDetails);

    // Draw loan details
    const loanDetailsData = [
  { label: 'Branch:', value: 'KOVILPATTI BRANCH' },
  { label: 'Doc Type:', value: 'Loan Collection Cash' },
  { label: 'Received With Thanks from Mr/Mrs:', value: loanDetails?.user_name ?? 'N/A' },
  { label: 'A sum of Rs:', value: loanDetails?.paid_amount ?? 'N/A' },
  { label: 'Employee Number:', value: loanDetails?.employee_number ?? 'N/A' },
  { label: 'Loan Number:', value: loanId ?? 'N/A' },
];

    const xOffsetLeft = 70;
    const xOffsetRight = page.getWidth() - 270;
    const yOffsetStart = height - 420;

    loanDetailsData.forEach((item, index) => {
      const yOffset = yOffsetStart - index * 20;
      page.drawText(item.label, { x: xOffsetLeft, y: yOffset, size: 16, font: regularFont });
      page.drawText(String(item.value), { x: xOffsetRight, y: yOffset, size: 16, font: regularFont });
    });

    // Draw footer
    const footerYOffset = 200;
    page.drawText('Sri Vari Finance', { x: page.getWidth() - 180, y: footerYOffset, size: 16, font: regularFont });
    page.drawText('Authority Signatory', { x: page.getWidth() - 180, y: footerYOffset - 20, size: 14, font: regularFont });
  };

  const saveOrSharePdf = async (pdfDoc: PDFDocument) => {
    const pdfBytes = await pdfDoc.save();

    if (Platform.OS === 'web') {
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Loan_Receipt.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Download triggered on web');
    } else {
      const base64PDF = arrayBufferToBase64(pdfBytes);
      const fileUri = FileSystem.documentDirectory + 'Loan_Receipt.pdf';
      await FileSystem.writeAsStringAsync(fileUri, base64PDF, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('File saved at:', fileUri);
      await Sharing.shareAsync(fileUri);
      console.log('Download triggered');
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
      console.error('User  ID is missing. Cannot log the action.');
      return;
    }

    const isoDate = new Date().toISOString();
    const now = isoDate.slice(0, 19).replace('T', ' ');

    await api.post('/download_loan_receipt', {
      table_name: 'loan_due',
      modified_data: { receipt_type: 'Loan_Receipt' },
      modified_on: now,
      modified_by: userId,
    });

    console.log('Download action logged successfully');
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


  const renderDetailItem = (label: string, value: string) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "N/A"}</Text>
    </View>
  );
 const fetchAndDownloadExcel = async () => {
  try {
    const response = await api.get(`/loans/${id}/dues`);
    console.log(response.data);

    const data = response.data.loan_dues;

    // ✅ 1. Validate response
    if (!data) {
      Alert.alert("Error:", "No data found in the response.");
      return;
    }

    if (!Array.isArray(data)) {
      Alert.alert("Error:", "Expected an array but received a different structure.");
      return;
    }

    if (data.length === 0) {
      Alert.alert("Error:", "The received array is empty.");
      return;
    }

    // ✅ 2. File name creation
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    const fileName = `Loan_Dues_${id}_${formattedDate}.xlsx`;

    // ✅ 3. Create workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Loan Dues");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    // ✅ 4. Download logic
    if (Platform.OS === "web") {
      const url = URL.createObjectURL(new Blob([excelBuffer]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const base64Data = Buffer.from(excelBuffer).toString("base64");
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(fileUri, {
        dialogTitle: "Download Excel File",
        UTI: "com.microsoft.excel.xlsx",
      });
    }

    // ✅ 5. Log the download action
    let userId;
    if (Platform.OS === "web") {
      userId = localStorage.getItem("user_id"); // FIX: Correct spelling
    } else {
      userId = await AsyncStorage.getItem("user_id");
    }

    if (!userId) {
      console.warn("User ID missing — cannot log download.");
      return;
    }

    const isoDate = new Date().toISOString();
    const now = isoDate.slice(0, 19).replace("T", " ");

    const apiResponse = await api.post("/download_loan_receipt", {
      table_name: "loan_due",
      modified_data: { receipt_type: "loan_due_receipt" },
      modified_on: now,
      modified_by: userId,
    });

    console.log("Download log response:", apiResponse.data); // Axios automatically parses JSON

  } catch (error: any) {
    console.error("Download error:", error);
    Alert.alert("Error downloading Excel file", error.message || "Unknown error occurred");
  }
};

const isNextMonth = (dueDate: string) => {
  const due = new Date(dueDate);
  const now = new Date();
  return (
    due.getMonth() === now.getMonth() + 1 &&
    due.getFullYear() === now.getFullYear()
  );
};

const renderItem = ({ item }: { item: any }) => (
  <View style={styles.itemContainer}>
    <TouchableOpacity
      style={styles.item}
      onPress={() => toggleExpand(item.id)}
    >
      <Text style={styles.detailsText}>Due Date: {item.due_date.split('T')[0]}</Text>
      
      <Text
        style={{
          color:
            item.status === 'paid'
              ? 'green'
              : item.status === 'pending'
              ? '#E8B701'
              : '#D90404',
        }}
      >
        {item.status}
      </Text>
      
      <Text style={styles.arrow}>
        {expandedItemId === item.id ? "▲" : "▼"}
      </Text>
    </TouchableOpacity>
    
    {expandedItemId === item.id && (
      <View style={styles.detailsContainer}>
        {renderDetailItem("Loan ID:", item.loan_id)}
        {renderDetailItem("User ID:", item.user_id)}
         {renderDetailItem("User Name:", item.customer_name)}
        {renderDetailItem("Due Amount:", item.next_amount || item.due_amount)}
        {renderDetailItem("Paid Date:", item.paid_on)}
        {renderDetailItem("Paid Amount:", item.paid_amount)}
        {renderDetailItem("Pending Amount:", item.pending_amount)}
        {renderDetailItem("Collected By:", item.collection_by)}
        {renderDetailItem("Status:", item.status)}
        {/* Additional details can be added here */}

        {/* Actions */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Show 'Edit' button if status is neither 'paid' nor 'pending' */}
          {(item.status !== "paid" && item.status !== "pending") && (
            <Button onPress={() => navigation.navigate("ViewLoanDueForm", { id: item })}>
              Edit
            </Button>
          )}
          
          {/* Show download option if status is 'paid' or 'pending' */}
          {(item.status === "paid" || item.status === "pending") && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Text style={styles.downloadtext}>Download:</Text>
              <TouchableOpacity onPress={() => handleDownloadLoanDueReceipt(item.loan_id, item.due_date)}>
                <MaterialIcons name="file-download" size={28} color="black" />
              </TouchableOpacity>
            </View>
          )}
          
        </View>
      </View>
    )}
  </View>
);
  const renderHeader = () => (
    <View style={{ padding: 0 }}>
  
      {role === "admin" && (
        <View style={styles.downloadContainer}>
          <Text style={styles.loanIdText}>Loan ID: {id}</Text>
          <View style={styles.iconsContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate("ViewCustomer", { id: id })}
              style={styles.iconStyle}
            >
              <SimpleLineIcons name="user" size={25} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={fetchAndDownloadExcel}
              //  onPress={fetchAndDownloadPDF}
              style={styles.iconStyle}
            >
              <MaterialIcons name="download" size={30} color="black" />
            </TouchableOpacity>


          </View>
        </View>
      )}
      {errorMessage ? (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      ) : data.length === 0 ? (
        <Text style={styles.errorMessage}>No dues available.</Text>
      ) : null}
    </View>
  );

  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem("role");
      if (storedRole) {
        setRole(storedRole);
      }
    };
    fetchRole();
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/loans/${id}/dues`);
          if (
            response.data.loan_dues &&
            Array.isArray(response.data.loan_dues)
          ) {
            setData(response.data.loan_dues);
            setErrorMessage("");
          } else {
            setErrorMessage("No dues found for this loan.");
          }
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.message || "An error occurred.";
          setErrorMessage(errorMsg);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [id])
  );
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      const timeout = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [visible, fadeAnim]);

  return (
    <>
    

      <FlatList
  data={data}
  keyExtractor={(item) => item.id.toString()}
  renderItem={renderItem}
  ListHeaderComponent={renderHeader}
  contentContainerStyle={{ paddingBottom: 60, flexGrow: 1, backgroundColor: "#07387A", }}
  showsVerticalScrollIndicator={true}
/>
</>
  );
}; 


export default ExpandableListItem;
const styles = StyleSheet.create({

  listContainer: {
    flex: 1,
    // backgroundColor: "#0D1B2A",
     backgroundColor: "#07387A",
    padding: 10,
    
  },

  
   headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#14274E',
  },
  header: {
    marginTop:30,
    textAlign: "center",
  
    fontSize: 20,
    fontWeight: "bold",
    padding: 10,
   
    color: '#fff',
    marginLeft: 40,
  },
  // Header styles
  // heading: {
  //   textAlign: 'center',
  //   fontSize: 24,
  //   fontWeight: 'bold',
  //   color: '#fff',
  //   marginVertical: 15,
  //   textShadowColor: 'rgba(0, 0, 0, 0.3)',
  //   textShadowOffset: { width: 2, height: 2 },
  //   textShadowRadius: 3,
  // },

  // Download header container
  downloadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F4C10F",
    padding: 8,
    borderRadius: 50,
    elevation: 2,
  
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
 
    marginVertical: 10,
  },

  // Loan ID text
  loanIdText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Icons container
  iconsContainer: {
    flexDirection: 'row',
  },

  // Icon style (spacing)
  iconStyle: {
    marginLeft: 20,
  },

  // Error message styling
  errorMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
    marginVertical: 10,
    fontWeight: '600',
  },

  // Item container with attractive style
  itemContainer: {
    backgroundColor: "#14274E",
    borderRadius: 15,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  // Item row (main header)
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Details text
  detailsText: {
    fontSize: 16,
    color: '#fff',
  },

  // Arrow indicator
  arrow: {
    fontSize: 20,
    color: '#fff',
  },

  // Details container inside expanded item
  detailsContainer: {
    marginTop: 10,
   backgroundColor: "#243B55",
    borderRadius: 10,
    padding: 10,
  },

  // Detail row
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  // Label and value styles
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },

  detailValue: {
    fontSize: 14,
    color: '#fff',
  },

  // Download text style
  downloadtext: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Overlay for loading spinner
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});