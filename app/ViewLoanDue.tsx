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
  Modal,
  TextInput,
  ScrollView,
  BackHandler,
} from "react-native";
import api from "./Api";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { MaterialIcons, SimpleLineIcons } from "@expo/vector-icons";
import { Buffer } from "buffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { router, useNavigation, useNavigationContainerRef } from "expo-router";
import { Button } from "react-native-paper";
import { Asset } from "expo-asset";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import DateTimePicker from "@react-native-community/datetimepicker";

const ExpandableListItem = () => {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [formError, setFormError] = useState(false);

  // For "Repay" modal
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    due_date: "",
    paid_amount: "",
    paid_on: new Date().toISOString().split("T")[0],
    collection_by: "A001",
  });
  const [currentItem, setCurrentItem] = useState<any>(null);

  // For "Edit Amount" modal
  const [showAmountEditModal, setShowAmountEditModal] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  const [canGoBack, setCanGoBack] = useState(false);
  const [lateDate, setLateDate] = useState("");
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const backAction = () => {
      if (canGoBack) {
        router.back();
      } else {
        router.replace("/ViewLoan");
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [router]);

  // Track history on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanGoBack(navigationRef.canGoBack());
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const route = useRoute();
  const { id } = route.params as { id: string };
  const navigation = useNavigation<any>();

  const toggleExpand = (itemId: any) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) return "N/A";

    let day = date.getDate().toString().padStart(2, "0");
    let month = (date.getMonth() + 1).toString().padStart(2, "0");
    let year = date.getFullYear();

    return `${day}-${month}-${year}`; // dd-mm-yyyy
  };

  // Fetch user role on mount
  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem("role");
      if (storedRole) {
        setRole(storedRole);
      }
    };
    fetchRole();
  }, []);

  // Fetch data on focus
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
          const loanDues = response.data.loan_dues;

          // ✅ Calculate total late days
          const totalLateDays = loanDues.reduce((sum, entry) => {
            return sum + Number(entry.late_days || 0);
          }, 0);

          setLateDate(totalLateDays);
          // console.log("Total Late Days:", totalLateDays);

          setData(loanDues);
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

  // Animate popup
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

  const handleDownloadLoanDueReceipt = async (loanId: any, dueDate: any) => {
    try {
      console.log("Starting receipt generation for Loan ID:", loanId);

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

      console.log("Receipt generated and downloaded successfully");
    } catch (error) {
      console.error("Error generating receipt:", error);
    }
  };

  const loadPdfTemplate = async () => {
    const pdfTemplate = require("@/assets/images/loan.pdf");
    const asset = Asset.fromModule(pdfTemplate);
    await asset.downloadAsync();

    if (!asset.localUri) {
      throw new Error("PDF asset could not be loaded.");
    }

    const existingPdfBytes = await FileSystem.readAsStringAsync(
      asset.localUri,
      {
        encoding: FileSystem.EncodingType.Base64,
      }
    );

    return Uint8Array.from(atob(existingPdfBytes), (c) => c.charCodeAt(0));
  };

  const fetchLoanDetails = async (loanId: any, dueDate: any) => {
    const response = await api.post("/loan_due_receipt", {
      loan_id: loanId,
      due_date: dueDate,
    });
    if (response.status !== 200) {
      throw new Error("Failed to fetch loan details");
    }
    return response.data;
  };

  const populatePdf = (
    pdfDoc: PDFDocument,
    loanDetails: {
      user_name: any;
      paid_amount: any;
      employee_number: any;
      due_amount: any;
      pending_amount: any;
      due_date: any;
      status: any;
      today_payment: any;
      last_paid_amount: any;
    },
    boldFont: any,
    regularFont: any,
    loanId: any
  ) => {
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const { height, width } = page.getSize();

    // Set margins and spacing
    const leftMargin = 70;
    const rightMargin = width - 70;
    const centerX = width / 2;
    let currentY = height - 270;

    // Company header - centered and larger
    const companyName = "Sri Vari Finance";
    const companyNameWidth = boldFont.widthOfTextAtSize(companyName, 28);
    page.drawText(companyName, {
      x: centerX - companyNameWidth / 2,
      y: currentY,
      size: 28,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });
    currentY -= 40;

    // Date - right aligned
    const dateText = `Date: ${new Date().toLocaleDateString("en-GB")}`;
    const dateWidth = regularFont.widthOfTextAtSize(dateText, 14);
    page.drawText(dateText, {
      x: width - leftMargin - dateWidth,
      y: currentY,
      size: 14,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    currentY -= 30;

    // Address - centered
    const address =
      "113A, Kariya Manicka Perumal Kovil Street, Melakadayanallur - 627751";
    const addressWidth = regularFont.widthOfTextAtSize(address, 14);
    page.drawText(address, {
      x: centerX - addressWidth / 2,
      y: currentY,
      size: 14,
      font: regularFont,
    });
    currentY -= 20;

    // Contact info - centered
    const contact =
      "Tel: +91 99621 92623 | Website: www.srivarifinance.in | CIN: S651979TN19BLC0068874";
    const contactWidth = regularFont.widthOfTextAtSize(contact, 14);
    page.drawText(contact, {
      x: centerX - contactWidth / 2,
      y: currentY,
      size: 14,
      font: regularFont,
    });
    currentY -= 40;

    // Divider line
    page.drawLine({
      start: { x: leftMargin, y: currentY },
      end: { x: rightMargin, y: currentY },
      thickness: 1.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 30;

    // Document title - centered
    const docTitle = "LOAN COLLECTION RECEIPT";
    const docTitleWidth = boldFont.widthOfTextAtSize(docTitle, 20);
    page.drawText(docTitle, {
      x: centerX - docTitleWidth / 2,
      y: currentY,
      size: 20,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });
    currentY -= 40;

    // Loan details data
    const loanDetailsData = [
      { label: "Branch:", value: "KADAYANALLUR BRANCH" },
      { label: "Doc Type:", value: "Loan Collection Cash" },
      {
        label: "Received With Thanks from Mr/Mrs:",
        value: loanDetails?.user_name ?? "N/A",
      },
      { label: "Loan ID:", value: loanId ?? "N/A" },
      { label: "Due Amount:", value: loanDetails?.due_amount ?? "N/A" },
      { label: "Total Paid Amount:", value: loanDetails?.paid_amount ?? "N/A" },
      // { label: 'Today Paid Amount:', value: loanDetails?.today_payment ?? '0' },
      {
        label: "Today Paid Amount:",
        value: loanDetails?.last_paid_amount ?? "0",
      },
      { label: "Pending Amount:", value: loanDetails?.pending_amount ?? "N/A" },
      { label: "Collection by:", value: loanDetails?.employee_number ?? "N/A" },
      { label: "Due Date:", value: loanDetails?.due_date ?? "N/A" },
      { label: "Status:", value: loanDetails?.status ?? "N/A" },
    ];

    // Draw loan details in two columns
    const labelStartX = leftMargin;
    const valueStartX = centerX + 50;
    const lineHeight = 28;

    loanDetailsData.forEach((item) => {
      // Draw label
      page.drawText(item.label, {
        x: labelStartX,
        y: currentY,
        size: 16,
        font: regularFont,
      });

      // Draw value
      page.drawText(String(item.value), {
        x: valueStartX,
        y: currentY,
        size: 16,
        font: boldFont,
      });

      currentY -= lineHeight;
    });

    // Calculate space needed for footer
    const footerHeight = 120;
    const contentBottom = currentY;
    const pageBottom = 50;

    if (contentBottom < footerHeight + pageBottom) {
      currentY = footerHeight + pageBottom;
    }

    // Draw divider line above footer
    const footerTop = footerHeight + pageBottom - 30;
    page.drawLine({
      start: { x: leftMargin, y: footerTop },
      end: { x: rightMargin, y: footerTop },
      thickness: 1.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Footer section
    const footerText = "Sri Vari Finance";
    const footerWidth = boldFont.widthOfTextAtSize(footerText, 18);
    page.drawText(footerText, {
      x: centerX - footerWidth / 2,
      y: footerTop - 30,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });

    const signatoryText = "Authorized Signatory";
    const signatoryWidth = regularFont.widthOfTextAtSize(signatoryText, 14);
    page.drawText(signatoryText, {
      x: centerX - signatoryWidth / 2,
      y: footerTop - 55,
      size: 14,
      font: regularFont,
    });

    // Footer contact info
    const footerContact =
      "www.srivarifinance.com | srivarifinance@gmail.com | +91 99621 92623";
    const footerContactWidth = regularFont.widthOfTextAtSize(footerContact, 12);
    page.drawText(footerContact, {
      x: centerX - footerContactWidth / 2,
      y: pageBottom + 20,
      size: 12,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });
  };

  const saveOrSharePdf = async (pdfDoc: PDFDocument) => {
    const pdfBytes = await pdfDoc.save();

    if (Platform.OS === "web") {
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Loan_Receipt.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("Download triggered on web");
    } else {
      const base64PDF = arrayBufferToBase64(pdfBytes);
      const fileUri = FileSystem.documentDirectory + "Loan_Receipt.pdf";
      await FileSystem.writeAsStringAsync(fileUri, base64PDF, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log("File saved at:", fileUri);
      await Sharing.shareAsync(fileUri);
      console.log("Download triggered");
    }
  };

  const logDownloadAction = async () => {
    let userId;
    if (Platform.OS === "web") {
      userId = localStorage.getItem("userid");
    } else {
      userId = await AsyncStorage.getItem("userid");
    }

    if (!userId) {
      console.error("User ID is missing. Cannot log the action.");
      return;
    }

    const isoDate = new Date().toISOString();
    const now = isoDate.slice(0, 19).replace("T", " ");

    await api.post("/download_loan_receipt", {
      table_name: "loan_due",
      modified_data: { receipt_type: "Loan_Receipt" },
      modified_on: now,
      modified_by: userId,
    });

    console.log("Download action logged successfully");
  };

  const arrayBufferToBase64 = (buffer: Iterable<number>) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const fetchAndDownloadExcel = async () => {
    try {
      const response = await api.get(`/loans/${id}/dues`);
      console.log(response.data);

      const data = response.data.loan_dues;

      if (!data) {
        Alert.alert("Error:", "No data found in the response.");
        return;
      }

      if (!Array.isArray(data)) {
        Alert.alert(
          "Error:",
          "Expected an array but received a different structure."
        );
        return;
      }

      if (data.length === 0) {
        Alert.alert("Error:", "The received array is empty.");
        return;
      }

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];
      const fileName = `Loan_Dues_${id}_${formattedDate}.xlsx`;

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Loan Dues");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

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

      let userId;
      if (Platform.OS === "web") {
        userId = localStorage.getItem("user_id");
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

      console.log("Download log response:", apiResponse.data);
    } catch (error: any) {
      console.error("Download error:", error);
      Alert.alert(
        "Error downloading Excel file",
        error.message || "Unknown error occurred"
      );
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

  // Render detail item
  const renderDetailItem = (label: string, value: string) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "N/A"}</Text>
    </View>
  );

  // Handle date change for the date picker
  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setFormData({ ...formData, paid_on: formattedDate });
    }
  };

  // Handle date change for the edit date picker
  const handleEditDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowEditDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setEditDate(formattedDate);
    }
  };

  // Handle amount payment submit
  const handleAmountPaymentSubmit = async () => {
    if (!editAmount || isNaN(Number(editAmount))) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!currentItem) {
      Alert.alert("Error", "No payment item selected");
      return;
    }

    try {
      const response = await api.put(
        `/loan/${currentItem.loan_id}/due/${currentItem.due_date}/edit-payment`,
        {
          paid_amount: Number(editAmount),
          paid_on: editDate || new Date().toISOString().split("T")[0],
        }
      );

      if (response.status === 200) {
        Alert.alert(
          "Success",
          response.data?.message || "Payment updated successfully"
        );
        setEditAmount("");
        setEditDate(new Date().toISOString().split("T")[0]);
        setCurrentItem(null);
        setShowAmountEditModal(false);

        // Refresh data
        const fetchResponse = await api.get(`/loans/${id}/dues`);
        if (
          fetchResponse.data.loan_dues &&
          Array.isArray(fetchResponse.data.loan_dues)
        ) {
          setData(fetchResponse.data.loan_dues);
        }
      }
    } catch (error: any) {
      console.error("Payment update error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.message ||
          "Failed to update payment"
      );
    }
  };

  // Render each list item
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.item}
        onPress={() => toggleExpand(item.id)}
      >
        <Text style={styles.detailsText}>
          Due Date: {formatDate(item.due_date)}
        </Text>

        <Text
          style={{
            color:
              item.status === "paid"
                ? "green"
                : item.status === "pending"
                ? "#E8B701"
                : "#D90404",
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
          {renderDetailItem("User Name:", item.user_name)}
          {renderDetailItem("Due Amount:", item.next_amount || item.due_amount)}
          {renderDetailItem(
            "Paid Date:",
            item.paid_on ? formatDate(item.paid_on) : "N/A"
          )}

          {renderDetailItem("Paid Amount:", item.paid_amount)}
          {renderDetailItem("Pending Amount:", item.pending_amount)}
          {renderDetailItem("Collected By:", item.collection_by)}
          {renderDetailItem("Status:", item.status)}
          {renderDetailItem("Late-Days:", item.late_days)}

          {/* Edit Amount button for each due */}
          <Button
            mode="contained"
            onPress={() => {
              setCurrentItem(item);
              setEditAmount(item.paid_amount || "");
              setEditDate(
                item.paid_on || new Date().toISOString().split("T")[0]
              );
              setShowAmountEditModal(true);
            }}
            style={{ marginTop: 10 }}
          >
            Edit Amount
          </Button>

          {/* Show 'Edit' button only if status is unpaid */}
          {item.status === "unpaid" && (
            <Button
              mode="contained"
              onPress={() =>
                navigation.navigate("ViewLoanDueForm", { id: item })
              }
              style={{ marginTop: 10 }}
            >
              Pay
            </Button>
          )}

          {/* Show 'Repay' button only if status is pending */}
          {item.status === "pending" && (
            <Button
              mode="contained"
              style={{ marginTop: 10 }}
              onPress={() => {
                setCurrentItem(item);
                setFormData({
                  due_date: item.due_date.split("T")[0],
                  pending_amount: item.pending_amount,
                  paid_amount: "",
                  paid_on: new Date().toISOString().split("T")[0],
                  collection_by: "",
                });
                setShowRepayModal(true);
              }}
            >
              Repay
            </Button>
          )}

          {/* Download option */}
          {(item.status === "paid" || item.status === "pending") && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <Text style={styles.downloadtext}>Download:</Text>
              <TouchableOpacity
                onPress={() =>
                  handleDownloadLoanDueReceipt(item.loan_id, item.due_date)
                }
              >
                <MaterialIcons name="file-download" size={28} color="black" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );

  // Header component
  const renderHeader = () => (
    <View style={{ padding: 0 }}>
      {role === "admin" && (
        <View style={styles.downloadContainer}>
          <Text style={styles.loanIdText}>Loan ID: {id}</Text>
          <Text >Total Late-Days:{lateDate}</Text>
          <View style={styles.iconsContainer}>
            <TouchableOpacity
              onPress={() => {
                console.log("Navigating to ViewCustomer with id:", id);
                navigation.navigate("ViewCustomer", { id });
              }}
              style={styles.iconStyle}
            >
              <SimpleLineIcons name="user" size={25} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={fetchAndDownloadExcel}
              style={styles.iconStyle}
            >
              <MaterialIcons name="download" size={30} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      {errorMessage ? (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      ) : (
        data.length === 0 && (
          <Text style={styles.errorMessage}>No dues available.</Text>
        )
      )}
    </View>
  );

  // Handler for the "Repaid" modal submit
  const handleRepaidSubmit = async () => {
    const { paid_amount, paid_on, collection_by, due_date } = formData;

    if (!paid_amount || !paid_on || !collection_by) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    if (!currentItem) return;

    try {
      await api.post(`/loan/${currentItem.loan_id}/pay-pending`, {
        due_date: due_date,
        paid_amount: parseFloat(paid_amount),
        paid_on: paid_on,
        collection_by: collection_by,
      });

      Alert.alert("Success", "Pending amount paid successfully");
      setShowRepayModal(false);

      const response = await api.get(`/loans/${id}/dues`);
      if (response.data.loan_dues && Array.isArray(response.data.loan_dues)) {
        setData(response.data.loan_dues);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pay pending amount");
    }
  };

  return (
    <>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{
          paddingBottom: 160,
          flexGrow: 1,
          backgroundColor: "#07387A",
        }}
        showsVerticalScrollIndicator={true}
      />

      {/* Modal for "Repay" */}
      <Modal
        visible={showRepayModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRepayModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Repay Loan</Text>

            {formError && (
              <Text
                style={{ color: "red", marginBottom: 10, textAlign: "center" }}
              >
                Please fill all the required fields!
              </Text>
            )}

            <Text style={styles.label}>Due Date</Text>
            <TextInput
              style={styles.input}
              value={formData.due_date ? formatDate(formData.due_date) : ""}
              editable={false}
            />

            <Text style={styles.label}>Pending Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Enter Paid Amount"
              value={formData.pending_amount}
              editable={false}
              onChangeText={(text) =>
                setFormData({ ...formData, pending_amount: text })
              }
            />

            <Text style={styles.label}>Paid Amount*</Text>
            <TextInput
              style={[
                styles.input,
                formError && !formData.paid_amount && { borderColor: "red" },
              ]}
              keyboardType="numeric"
              placeholder="Enter Paid Amount"
              value={formData.paid_amount}
              onChangeText={(text) =>
                setFormData({ ...formData, paid_amount: text })
              }
            />

            <Text style={styles.label}>Paid On*</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <TextInput
                style={[
                  styles.input,
                  formError && !formData.paid_on && { borderColor: "red" },
                ]}
                value={formData.paid_on ? formatDate(formData.paid_on) : ""}
                editable={false}
                placeholder="Select Date"
              />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={
                  formData.paid_on ? new Date(formData.paid_on) : new Date()
                }
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            <Text style={styles.label}>Collection By*</Text>
            <TextInput
              style={[
                styles.input,
                formError && !formData.collection_by && { borderColor: "red" },
              ]}
              placeholder="Please enter your ID (ex:A001 or EMP0001)"
              value={formData.collection_by}
              onChangeText={(text) =>
                setFormData({ ...formData, collection_by: text })
              }
            />

            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={() => {
                  if (
                    !formData.paid_amount ||
                    !formData.paid_on ||
                    !formData.collection_by
                  ) {
                    setFormError(true);
                    return;
                  }
                  handleRepaidSubmit();
                }}
                style={styles.button}
              >
                Repay
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowRepayModal(false);
                  setFormError(false);
                }}
                style={styles.button}
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for "Edit Amount" */}
      <Modal
        visible={showAmountEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAmountEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Payment Amount</Text>

            <Text style={styles.label}>Loan ID</Text>
            <TextInput
              style={styles.input}
              value={currentItem?.loan_id || ""}
              editable={false}
            />

            <Text style={styles.label}>New Paid Amount (₹)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Enter amount"
              value={editAmount}
              onChangeText={setEditAmount}
            />

            <Text style={styles.label}>Payment Date</Text>
            <TouchableOpacity onPress={() => setShowEditDatePicker(true)}>
              <TextInput
                style={styles.input}
                value={editDate ? formatDate(editDate) : ""}
                editable={false}
                placeholder="Select Date"
              />
            </TouchableOpacity>

            {showEditDatePicker && (
              <DateTimePicker
                value={editDate ? new Date(editDate) : new Date()}
                mode="date"
                display="default"
                onChange={handleEditDateChange}
              />
            )}

            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={handleAmountPaymentSubmit}
                style={styles.button}
              >
                Update Payment
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowAmountEditModal(false);
                  setEditAmount("");
                  setEditDate(new Date().toISOString().split("T")[0]);
                }}
                style={styles.button}
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    backgroundColor: "#07387A",
    padding: 10,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#14274E",
  },
  header: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    padding: 10,
    color: "#fff",
    marginLeft: 40,
  },
  downloadContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F4C10F",
    padding: 8,
    borderRadius: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginVertical: 10,
  },
  loanIdText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  iconsContainer: {
    flexDirection: "row",
  },
  iconStyle: {
    marginLeft: 20,
  },
  errorMessage: {
    textAlign: "center",
    fontSize: 16,
    color: "#fff",
    marginVertical: 10,
    fontWeight: "600",
  },
  itemContainer: {
    backgroundColor: "#14274E",
    borderRadius: 15,
    padding: 15,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsText: {
    fontSize: 16,
    color: "#fff",
  },
  arrow: {
    fontSize: 20,
    color: "#fff",
  },
  detailsContainer: {
    marginTop: 10,
    backgroundColor: "#243B55",
    borderRadius: 10,
    padding: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  detailValue: {
    fontSize: 14,
    color: "#fff",
  },
  downloadtext: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "center",
  },
  label: {
    fontSize: 14,
    marginVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default ExpandableListItem;
