import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Asset } from "expo-asset";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Picker } from "@react-native-picker/picker";
import { Searchbar, Button } from "react-native-paper";
import { router, useNavigation, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PDFDocument, PDFFont, rgb, StandardFonts } from "pdf-lib";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";

import api from "./Api";
import { BackHandler } from "react-native";
import axios from "axios";

interface LoanDetails {
  employee_id: any;
  loan_id: any;
  pending_amount: any;
  loan_date: any;
  engine_number: any;
  loan_amount: any;
  due_amount: any;
  tenure_month: any;
  user_id: any;
  loan_closed_date: any;
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
  status: string;
  email: string;
  customer_name: string;
  total_amount: string;
  created_at: any;
}

interface SettlementData {
  loan_id: any;
  paid_months: any;
  paid_amount_total: any;
  pending_months: any;
  balance_due_amount: any;
}

interface DueItem {
  due_date: string;
  due_amount: number;
  paid_amount: number;
  status: string;
}

interface ReceiptData {
  receipt_no: string;
  loan_id: string;
  customer_name: string;
  customer_phone: string;
  paid_now: number;
  total_paid_for_loan: number;
  total_balance_for_loan: number;
  settlement_paid_date: string;
  payment_status: string;
  dues: DueItem[];
}

const ExpandableListItem = () => {
  const [DATA, SETDATA] = useState<any[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);
  const [settlementData, setSettlementData] = useState<SettlementData | null>(
    null
  );
  const [paidAmount, setPaidAmount] = useState("");
  const [settlementDate, setSettlementDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [additionalCharge, setAdditionalCharge] = useState("");
  const [adjustment, setAdjustment] = useState("");
  const [finalSettleAmount, setFinalSettleAmount] = useState("");
  const [lateDate, setLateDate] = useState("");
  const navigation = useNavigation();

  const router = useRouter();
  useEffect(() => {
    const backAction = () => {
      router.replace("/");
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [router]);

  useEffect(() => {
    // if (!loanId?.loan_id) return; // Prevent running if loanId is missing

    // console.log("loanId", settlementData?.loan_id);
    // console.log("loan-ID", settlementData?.loan_id);

    const fetchLoanDues = async () => {
      try {
        const res = await axios.get(
          `https://reiosglobal.com/srivarimob/api/loans/${settlementData?.loan_id}/dues`
        );

        const loanDues = res.data.loan_dues || [];

        // ✅ Calculate total late days
        const totalLateDays = loanDues.reduce((sum, entry) => {
          return sum + Number(entry.late_days || 0);
        }, 0);
        setLateDate(totalLateDays);
        // console.log("Total Late Days:", totalLateDays);

        // Optional: setLoanDues(loanDues);
        // Optional: setTotalLateDays(totalLateDays);
      } catch (error) {
        console.error("Error fetching loan dues:", error);
      }
    };

    fetchLoanDues();
  }, [settlementData]);

  const toggleExpand = async (id: string) => {
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

  const handleOpenSettlementModal = async (loanId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/getLoanDueSummary/${loanId}`);
      let data;
      if (typeof response.data === "string") {
        const cleaned = response.data.replace(/^\/\/\s*/, "");
        data = JSON.parse(cleaned);
      } else {
        data = response.data;
      }

      setSettlementData(data);
      setPaidAmount(data.balance_due_amount.toString());
      setSettlementModalVisible(true);
    } catch (error: any) {
      console.error("Error fetching settlement data:", error);
      Alert.alert("Error", "Failed to fetch settlement details");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSettlementDate(selectedDate);
    }
  };

  const handleSettlementSubmit = async () => {
    if (!settlementData) return;

    const paidAmountNum = parseFloat(finalSettleAmount); // use final amount instead of manual paidAmount

    // 🔹 Validate amount
    if (isNaN(paidAmountNum)) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    if (paidAmountNum <= 0) {
      Alert.alert("Error", "Amount must be greater than 0");
      return;
    }

    // 🔹 Validate settlement date
    if (!settlementDate) {
      Alert.alert("Error", "Please select a settlement date");
      return;
    }

    // 🔹 Add confirmation dialog
    Alert.alert(
      "Confirm Settlement",
      `Are you sure you want to process a settlement of ₹${paidAmountNum}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setIsSubmitting(true);

              // ✅ API call with additional fields
              const response = await api.post(
                `/loans/${settlementData.loan_id}/pay-full-balance`,
                {
                  paid_amount: paidAmountNum,
                  settlement_paid_date: settlementDate
                    .toISOString()
                    .split("T")[0],
                  additional_charge: parseFloat(additionalCharge) || 0,
                  adjustment: parseFloat(adjustment) || 0,
                }
              );

              // console.log(" Settlement API Response:", response.data);

              if (response.status === 200) {
                Alert.alert("Success", "Settlement processed successfully");
                setSettlementModalVisible(false);

                if (expandedItemId) {
                  toggleExpand(expandedItemId);
                }
              } else {
                throw new Error(
                  response.data.message || "Failed to process settlement"
                );
              }
            } catch (error: any) {
              console.error("Settlement error:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to process settlement"
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const fetchFullBalanceReceiptData = async (
    loanId: string
  ): Promise<ReceiptData> => {
    try {
      const response = await api.get("/loans/receipt", {
        params: { loan_id: loanId },
      });

      if (!response?.data) {
        console.error("Invalid API response:", response);
        throw new Error("Server returned empty response");
      }

      // Parse response data (handle both string and object responses)
      let rawData =
        typeof response.data === "string"
          ? JSON.parse(response.data.replace(/^\/\/\s*/, ""))
          : response.data;

      // Extract receipt data from different response structures
      const receiptData = rawData.receipt || rawData.data || rawData;

      // Debug log to inspect the actual response structure
      // console.log('Raw receipt data from API:', receiptData);

      // Validate and transform data with comprehensive fallbacks
      const transformedData: ReceiptData = {
        receipt_no:
          receiptData.receipt_no ||
          receiptData.transaction_id ||
          `RCPT-${Date.now().toString().slice(-6)}`,
        loan_id: receiptData.loan_id || loanId,
        customer_name:
          receiptData.customer_name ||
          receiptData.user_name ||
          receiptData.customer?.name ||
          "Customer",
        customer_phone:
          receiptData.customer_phone ||
          receiptData.mobile_number ||
          receiptData.customer?.phone ||
          "N/A",
        paid_now: parseFloat(receiptData.paid_now) || 0,
        total_paid_for_loan:
          parseFloat(receiptData.total_paid_for_loan) ||
          parseFloat(receiptData.paid_amount_total) ||
          calculateTotalPaid(receiptData.dues),
        total_balance_for_loan:
          parseFloat(receiptData.total_balance_for_loan) ||
          parseFloat(receiptData.balance_due_amount) ||
          0,
        settlement_paid_date:
          receiptData.settlement_paid_date ||
          receiptData.paid_on ||
          new Date().toISOString().split("T")[0],
        payment_status:
          receiptData.payment_status ||
          (receiptData.total_balance_for_loan <= 0 ? "paid" : "pending"),
        dues: Array.isArray(receiptData.dues)
          ? receiptData.dues.map((due) => ({
              due_date: due.due_date || "N/A",
              due_amount: parseFloat(due.due_amount) || 0,
              paid_amount: parseFloat(due.paid_amount) || 0,
              status: due.status || (due.paid_amount > 0 ? "paid" : "pending"),
            }))
          : [],
      };

      // Final validation - ensure we have absolute minimum required data
      if (!transformedData.loan_id || !transformedData.customer_name) {
        throw new Error("Insufficient data to generate receipt");
      }

      return transformedData;
    } catch (error: any) {
      console.error("Error processing receipt data:", {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Could not prepare receipt data: ${error.message}`);
    }
  };

  const calculateTotalPaid = (dues: DueItem[] = []): number => {
    return dues.reduce(
      (total, due) => total + (parseFloat(due.paid_amount) || 0),
      0
    );
  };

  const preparePdfDocument = async () => {
    const pdfBytes = await loadPdfTemplate();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    return { pdfDoc, boldFont, regularFont };
  };

  const generateFullBalanceReceipt = async (
    loanId: string,
    receiptData: ReceiptData
  ): Promise<Uint8Array> => {
    try {
      // Load PDF template
      const pdfBytes = await loadPdfTemplate();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Embed fonts
      const [boldFont, regularFont] = await Promise.all([
        pdfDoc.embedFont(StandardFonts.HelveticaBold),
        pdfDoc.embedFont(StandardFonts.Helvetica),
      ]);

      // Populate PDF with data
      populateFullBalancePdf(pdfDoc, receiptData, boldFont, regularFont);

      // Save and return PDF
      return await pdfDoc.save();
    } catch (error: any) {
      console.error("PDF generation error:", error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  };
  const populateFullBalancePdf = (
    pdfDoc: PDFDocument,
    receiptData: ReceiptData,
    boldFont: PDFFont,
    regularFont: PDFFont
  ) => {
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const { height, width } = page.getSize();

    const leftMargin = 50;
    const rightMargin = width - 50;
    const centerX = width / 2;
    let currentY = height - 270;
    const lineHeight = 28;
    const sectionSpacing = 25;

    const drawCenteredText = (
      text: string,
      y: number,
      size: number,
      font: PDFFont,
      isBold = false,
      color = rgb(0, 0, 0)
    ) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: centerX - textWidth / 2,
        y,
        size,
        font: isBold ? boldFont : regularFont,
        color,
      });
    };

    const drawLabelValue = (
      label: string,
      value: string,
      y: number,
      labelX: number,
      valueX: number,
      labelSize = 16,
      valueSize = 16,
      labelColor = rgb(0.2, 0.2, 0.6),
      valueColor = rgb(0, 0, 0)
    ) => {
      page.drawText(label, {
        x: labelX,
        y,
        size: labelSize,
        font: regularFont,
        color: labelColor,
      });

      page.drawText(value, {
        x: valueX,
        y,
        size: valueSize,
        font: boldFont,
        color: valueColor,
      });
    };

    const drawSectionHeader = (text: string, y: number) => {
      drawCenteredText(text, y, 22, boldFont, true, rgb(0.2, 0.2, 0.6));
      return y - lineHeight - 10;
    };

    const formatCurrency = (amount: number) =>
      `Rs. ${amount.toLocaleString("en-IN")}`;

    drawCenteredText(
      "Sri Vari Finance",
      currentY,
      30,
      boldFont,
      true,
      rgb(0.2, 0.2, 0.6)
    );
    currentY -= 40;

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

    drawCenteredText(
      "113A, Kariya Manicka Perumal Kovil Street, Melakadayanallur - 627751",
      currentY,
      14,
      regularFont
    );
    currentY -= 25;
    drawCenteredText(
      "Tel: +91 99621 92623 | Fax: +91 99621 92623 | Website: www.srivarifinance.in",
      currentY,
      14,
      regularFont
    );
    currentY -= 25;
    drawCenteredText(
      "Corporate Identity Number (CIN) S65191TN1979BLC006874",
      currentY,
      14,
      regularFont
    );
    currentY -= 40;

    page.drawLine({
      start: { x: leftMargin, y: currentY },
      end: { x: rightMargin, y: currentY },
      thickness: 1.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 30;

    currentY = drawSectionHeader("FULL BALANCE RECEIPT", currentY);

    const labelX = leftMargin + 50;
    const valueX = centerX + 50;

    drawLabelValue(
      "Receipt No:",
      receiptData.receipt_no || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Loan ID:",
      receiptData.loan_id || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Customer Name:",
      receiptData.customer_name || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Phone:",
      receiptData.customer_phone || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight * 1.5;

    page.drawLine({
      start: { x: leftMargin, y: currentY },
      end: { x: rightMargin, y: currentY },
      thickness: 1.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 30;

    currentY = drawSectionHeader("PAYMENT SUMMARY", currentY);

    drawLabelValue(
      "Amount Paid Now:",
      formatCurrency(receiptData.paid_now),
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Total Paid for Loan:",
      formatCurrency(receiptData.total_paid_for_loan),
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Balance Amount:",
      formatCurrency(receiptData.total_balance_for_loan),
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Settlement Date:",
      receiptData.settlement_paid_date || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Payment Status:",
      receiptData.payment_status || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight * 1.5;

    page.drawLine({
      start: { x: leftMargin, y: currentY },
      end: { x: rightMargin, y: currentY },
      thickness: 1.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 30;

    currentY = drawSectionHeader("DUES PAYMENT DETAILS", currentY);
    currentY -= 20;

    const leftColumnDues = receiptData.dues.slice(0, 6);
    const rightColumnDues = receiptData.dues.slice(6, 12);

    const tableWidth = 250;
    const leftTableX = leftMargin;
    const rightTableX = centerX + 30;
    const rowHeight = 20;
    const col1 = 0;
    const col2 = 80;
    const col3 = 160;
    const col4 = 240;

    page.drawText("Due Date", {
      x: leftTableX + col1,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });
    page.drawText("Due Amount", {
      x: leftTableX + col2,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });
    page.drawText("Paid Amount", {
      x: leftTableX + col3,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });
    page.drawText("Status", {
      x: leftTableX + col4,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });

    page.drawText("Due Date", {
      x: rightTableX + col1,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });
    page.drawText("Due Amount", {
      x: rightTableX + col2,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });
    page.drawText("Paid Amount", {
      x: rightTableX + col3,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });
    page.drawText("Status", {
      x: rightTableX + col4,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });

    currentY -= rowHeight;

    const maxRows = Math.max(leftColumnDues.length, rightColumnDues.length);
    for (let i = 0; i < maxRows; i++) {
      if (i < leftColumnDues.length) {
        const due = leftColumnDues[i];
        page.drawText(due.due_date || "N/A", {
          x: leftTableX + col1,
          y: currentY,
          size: 10,
          font: regularFont,
        });
        page.drawText(formatCurrency(due.due_amount), {
          x: leftTableX + col2,
          y: currentY,
          size: 10,
          font: regularFont,
        });
        page.drawText(formatCurrency(due.paid_amount), {
          x: leftTableX + col3,
          y: currentY,
          size: 10,
          font: regularFont,
        });
        page.drawText(due.status?.toUpperCase() || "N/A", {
          x: leftTableX + col4,
          y: currentY,
          size: 10,
          font: regularFont,
        });
      }

      if (i < rightColumnDues.length) {
        const due = rightColumnDues[i];
        page.drawText(due.due_date || "N/A", {
          x: rightTableX + col1,
          y: currentY,
          size: 10,
          font: regularFont,
        });
        page.drawText(formatCurrency(due.due_amount), {
          x: rightTableX + col2,
          y: currentY,
          size: 10,
          font: regularFont,
        });
        page.drawText(formatCurrency(due.paid_amount), {
          x: rightTableX + col3,
          y: currentY,
          size: 10,
          font: regularFont,
        });
        page.drawText(due.status?.toUpperCase() || "N/A", {
          x: rightTableX + col4,
          y: currentY,
          size: 10,
          font: regularFont,
        });
      }

      currentY -= rowHeight;
    }

    const footerTop = 100;
    page.drawLine({
      start: { x: leftMargin, y: footerTop + 90 },
      end: { x: rightMargin, y: footerTop + 90 },
      thickness: 1.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    drawCenteredText(
      "Sri Vari Finance",
      footerTop + 60,
      22,
      boldFont,
      true,
      rgb(0.2, 0.2, 0.6)
    );
    drawCenteredText(
      "Authorised Signatory",
      footerTop + 30,
      16,
      regularFont,
      false,
      rgb(0.4, 0.4, 0.4)
    );

    drawCenteredText(
      "www.srivarifinance.com | srivarifinance@gmail.com | +91 99621 92623",
      footerTop,
      14,
      regularFont,
      false,
      rgb(0.4, 0.4, 0.4)
    );
  };
  const handleWebDownload = async (pdfBytes: Uint8Array, loanId: string) => {
    try {
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `full_balance_receipt_${loanId}.pdf`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error: any) {
      throw new Error(`Web download failed: ${error.message}`);
    }
  };

  const handleMobileShare = async (pdfBytes: Uint8Array, loanId: string) => {
    try {
      // Check sharing availability
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Sharing not available on this device");
      }

      // Convert to base64
      const base64PDF = arrayBufferToBase64(pdfBytes);
      const fileUri =
        FileSystem.documentDirectory + `full_balance_receipt_${loanId}.pdf`;

      // Write file
      await FileSystem.writeAsStringAsync(fileUri, base64PDF, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share file
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Receipt",
        UTI: "com.adobe.pdf",
      });

      // Cleanup - optional, could keep for user to access later
      // await FileSystem.deleteAsync(fileUri);
    } catch (error: any) {
      throw new Error(`Mobile share failed: ${error.message}`);
    }
  };

  const handleDownloadFullBalanceReceipt = async (loanId: string) => {
    try {
      setIsDownloading(true);

      // 1. Fetch and validate receipt data
      const receiptData = await fetchFullBalanceReceiptData(loanId);

      // 2. Generate PDF bytes
      const pdfBytes = await generateFullBalanceReceipt(loanId, receiptData);

      // 3. Handle platform-specific download/share
      if (Platform.OS === "web") {
        await handleWebDownload(pdfBytes, loanId);
      } else {
        await handleMobileShare(pdfBytes, loanId);
      }
    } catch (error: any) {
      console.error("Receipt generation error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to generate receipt. Please try again."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const loadPdfTemplate = async (): Promise<Uint8Array> => {
    try {
      const pdfTemplate = require("@/assets/images/loan.pdf");
      const asset = Asset.fromModule(pdfTemplate);

      await asset.downloadAsync();

      if (!asset.localUri) {
        throw new Error("PDF template not found");
      }

      if (Platform.OS === "web") {
        const response = await fetch(asset.localUri);
        return new Uint8Array(await response.arrayBuffer());
      } else {
        const base64String = await FileSystem.readAsStringAsync(
          asset.localUri,
          {
            encoding: FileSystem.EncodingType.Base64,
          }
        );
        return new Uint8Array(
          atob(base64String)
            .split("")
            .map((c) => c.charCodeAt(0))
        );
      }
    } catch (error: any) {
      console.error("Template loading error:", error);
      throw new Error(`Failed to load PDF template: ${error.message}`);
    }
  };

  const fetchLoanDetails = async (loanId: any) => {
    const response = await api.post("/loan_receipt", { loan_id: loanId });
    let data;
    if (typeof response.data === "string") {
      const cleaned = response.data.replace(/^\/\/\s*/, "");
      data = JSON.parse(cleaned);
    } else {
      data = response.data;
    }
    if (response.status !== 200) {
      throw new Error("Failed to fetch loan details");
    }
    return response.data.data;
  };

  const handleDownloadReceipt = async (loanId: any) => {
    try {
      const pdfBytes = await loadPdfTemplate();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const loanDetailsData = await fetchLoanDetails(loanId);
      populatePdf(pdfDoc, loanDetailsData, boldFont, regularFont);

      const finalPdfBytes = await pdfDoc.save();

      if (Platform.OS === "web") {
        const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `loan_receipt_${loanId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const base64PDF = arrayBufferToBase64(finalPdfBytes);
        const fileUri =
          FileSystem.documentDirectory + `loan_receipt_${loanId}.pdf`;
        await FileSystem.writeAsStringAsync(fileUri, base64PDF, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error("Error generating receipt:", error);
      Alert.alert("Error", "Failed to generate receipt");
    }
  };

  const populatePdf = (
    pdfDoc: PDFDocument,
    loanDetails: LoanDetails,
    boldFont: PDFFont,
    regularFont: PDFFont
  ) => {
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const { height, width } = page.getSize();

    const leftMargin = 50;
    const rightMargin = width - 50;
    const centerX = width / 2;
    let currentY = height - 270;
    const lineHeight = 28;
    const sectionSpacing = 25;

    const drawCenteredText = (
      text: string,
      y: number,
      size: number,
      font: PDFFont,
      isBold = false,
      color = rgb(0, 0, 0)
    ) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: centerX - textWidth / 2,
        y,
        size,
        font: isBold ? boldFont : regularFont,
        color,
      });
    };

    const drawLabelValue = (
      label: string,
      value: string,
      y: number,
      labelX: number,
      valueX: number,
      labelSize = 16,
      valueSize = 16,
      labelColor = rgb(0.2, 0.2, 0.6),
      valueColor = rgb(0, 0, 0)
    ) => {
      page.drawText(label, {
        x: labelX,
        y,
        size: labelSize,
        font: regularFont,
        color: labelColor,
      });

      page.drawText(value, {
        x: valueX,
        y,
        size: valueSize,
        font: boldFont,
        color: valueColor,
      });
    };

    const drawSectionHeader = (text: string, y: number) => {
      drawCenteredText(text, y, 22, boldFont, true, rgb(0.2, 0.2, 0.6));
      return y - lineHeight - 10;
    };

    drawCenteredText(
      "Sri Vari Finance",
      currentY,
      30,
      boldFont,
      true,
      rgb(0.2, 0.2, 0.6)
    );
    currentY -= 40;

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

    drawCenteredText(
      "113A, Kariya Manicka Perumal Kovil Street, Melakadayanallur - 627751",
      currentY,
      14,
      regularFont
    );
    currentY -= 25;

    drawCenteredText(
      "Tel: +91 99621 92623 | Fax: +91 99621 92623 | Website: www.srivarifinance.in",
      currentY,
      14,
      regularFont
    );
    currentY -= 25;
    drawCenteredText(
      "Corporate Identity Number (CIN) S65191TN1979BLC006874",
      currentY,
      14,
      regularFont
    );
    currentY -= 40;

    page.drawLine({
      start: { x: leftMargin, y: currentY },
      end: { x: rightMargin, y: currentY },
      thickness: 1.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 30;

    currentY = drawSectionHeader("LOAN DETAILS", currentY);

    const labelX = leftMargin + 50;
    const valueX = centerX + 50;

    drawLabelValue("Branch:", "KADAYANALLUR BRANCH", currentY, labelX, valueX);
    currentY -= lineHeight;
    drawLabelValue(
      "Customer No:",
      loanDetails?.user_id || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Employee Number:",
      loanDetails?.employee_id || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Customer Name:",
      loanDetails?.customer_name || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Loan number:",
      loanDetails.loan_id || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Mobile Number:",
      loanDetails.mobile_number || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Loan Amount:",
      loanDetails.loan_amount || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Due Amount:",
      loanDetails.due_amount || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Tenure:",
      loanDetails.tenure_month ? `${loanDetails.tenure_month} months` : "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight * 1.5;

    page.drawLine({
      start: { x: leftMargin, y: currentY },
      end: { x: rightMargin, y: currentY },
      thickness: 1.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 30;

    currentY = drawSectionHeader("VEHICLE DETAILS", currentY);

    drawLabelValue(
      "Segment:",
      loanDetails.segment || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Vehicle Number:",
      loanDetails.VIN_number || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Year of Manufacture:",
      loanDetails.year_of_manufacture || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Make:",
      loanDetails.vehicle_make || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight;
    drawLabelValue(
      "Chassis No:",
      loanDetails.chassis_number || "N/A",
      currentY,
      labelX,
      valueX
    );
    currentY -= lineHeight * 2;

    const footerMargin = 150;
    const footerContentHeight = 120;

    if (currentY < footerMargin + footerContentHeight) {
      currentY = footerMargin + footerContentHeight;
    }

    const footerTop = footerMargin + footerContentHeight - 30;
    page.drawLine({
      start: { x: leftMargin, y: footerTop },
      end: { x: rightMargin, y: footerTop },
      thickness: 1.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    drawCenteredText(
      "Sri Vari Finance",
      footerTop - 30,
      22,
      boldFont,
      true,
      rgb(0.2, 0.2, 0.6)
    );
    drawCenteredText(
      "Authorised Signatory",
      footerTop - 60,
      16,
      regularFont,
      false,
      rgb(0.4, 0.4, 0.4)
    );

    drawCenteredText(
      "www.srivarifinance.com | srivarifinance@gmail.com | +91 99621 92623",
      footerMargin + 20,
      14,
      regularFont,
      false,
      rgb(0.4, 0.4, 0.4)
    );
  };

  const arrayBufferToBase64 = (buffer: Uint8Array) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
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
      console.error("Error updating status:", error);
    } finally {
      setLoading(false);
    }
  };

  const allLoanCount = DATA.length;
  const inProgressCount = DATA.filter(
    (item) => item.status === "inprogress"
  ).length;
  const pendingCount = DATA.filter((item) => item.status === "pending").length;
  const precloseCount = DATA.filter(
    (item) => item.status === "preclose"
  ).length;
  const completedCount = DATA.filter(
    (item) => item.status === "completed"
  ).length;

  const filteredData = DATA.filter((item: any) => {
    const matchesSearch =
      (typeof item.loan_id === "string" &&
        item.loan_id.toLowerCase().includes(search.toLowerCase())) ||
      (typeof item.customer_name === "string" &&
        item.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (typeof item.VIN_number === "string" &&
        item.VIN_number.toLowerCase().includes(search.toLowerCase()));

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "inprogress")
      return matchesSearch && item.status === "inprogress";
    if (filterStatus === "pending")
      return matchesSearch && item.status === "pending";
    if (filterStatus === "preclose")
      return matchesSearch && item.status === "preclose";
    if (filterStatus === "completed")
      return matchesSearch && item.status === "completed";

    return false;
  });

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
  // console.log("VIN number:", DATA.VIN_number)

  const fetchLoanDetail = async (loanId: string) => {
    try {
      const response = await fetch(
        `https://reiosglobal.com/srivarimob/api/loans`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch loans");
      }

      // Manual parsing (faster for large payloads)
      const text = await response.text();
      const data = JSON.parse(text);

      if (!data?.loans || !Array.isArray(data.loans)) {
        throw new Error("Invalid loans data");
      }

      const selectedLoan = data.loans.find(
        (loan: any) => loan.loan_id === loanId
      );
      if (!selectedLoan) {
        console.warn(`Loan with ID ${loanId} not found`);
        return null;
      }

      // Convert base64 images to data URIs (lazy conversion)
      const convertBase64ToUri = (base64String?: string) => {
        if (!base64String) return "";
        return `data:image/jpeg;base64,${base64String}`;
      };

      // Return without converting all images immediately
      // Images will be converted only when accessed (lazy getter)
      return {
        ...selectedLoan,
        get vehicle_exterior_photo_front() {
          return convertBase64ToUri(
            selectedLoan.vehicle_exterior_photo_front_base64
          );
        },
        get vehicle_exterior_photo_back() {
          return convertBase64ToUri(
            selectedLoan.vehicle_exterior_photo_back_base64
          );
        },
        get vehicle_exterior_photo_left() {
          return convertBase64ToUri(
            selectedLoan.vehicle_exterior_photo_left_base64
          );
        },
        get vehicle_exterior_photo_right() {
          return convertBase64ToUri(
            selectedLoan.vehicle_exterior_photo_right_base64
          );
        },
        get odometer_reading_photo() {
          return convertBase64ToUri(selectedLoan.odometer_reading_photo_base64);
        },
        get engine_number_photo_base64() {
          return convertBase64ToUri(selectedLoan.chassis_number_photo);
        },
        get image() {
          return convertBase64ToUri(selectedLoan.transaction_proof);
        },
      };
    } catch (error) {
      console.error("Fetch error:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!settlementData) return;

    let base = parseFloat(settlementData.balance_due_amount) || 0;
    let addCharge = parseFloat(additionalCharge) || 0;
    let adjust = parseFloat(adjustment) || 0;

    let finalAmount = base + addCharge - adjust;

    setFinalSettleAmount(finalAmount.toString());
  }, [additionalCharge, adjustment, settlementData]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return ""; // invalid date handle

    let day = date.getDate().toString().padStart(2, "0");
    let month = (date.getMonth() + 1).toString().padStart(2, "0");
    let year = date.getFullYear();

    return `${day}-${month}-${year}`; // dd-mm-yyyy
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Searchbar
          placeholder="Search by Loan ID or Name or VIN"
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
            <Text style={styles.filterButtonText}>
              All Loans ({allLoanCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === "inprogress" && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus("inprogress")}
          >
            <Text style={styles.filterButtonText}>
              In Progress ({inProgressCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === "pending" && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus("pending")}
          >
            <Text style={styles.filterButtonText}>
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === "preclose" && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus("preclose")}
          >
            <Text style={styles.filterButtonText}>
              Preclosed ({precloseCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === "completed" && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus("completed")}
          >
            <Text style={styles.filterButtonText}>
              Completed ({completedCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

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

      <Modal
        visible={settlementModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettlementModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Loan Settlement</Text>

            {loading ? (
              <ActivityIndicator size="large" color="#F4C10F" />
            ) : settlementData ? (
              <>
                <View style={styles.settlementRow}>
                  <Text style={styles.settlementLabel}>Loan ID:</Text>
                  <Text style={styles.settlementValue}>
                    {settlementData.loan_id}
                  </Text>
                </View>
                <View style={styles.settlementRow}>
                  <Text style={styles.settlementLabel}>Paid Months:</Text>
                  <Text style={styles.settlementValue}>
                    {settlementData.paid_months}
                  </Text>
                </View>
                <View style={styles.settlementRow}>
                  <Text style={styles.settlementLabel}>Total Paid:</Text>
                  <Text style={styles.settlementValue}>
                    ₹{settlementData.paid_amount_total}
                  </Text>
                </View>
                <View style={styles.settlementRow}>
                  <Text style={styles.settlementLabel}>Pending Months:</Text>
                  <Text style={styles.settlementValue}>
                    {settlementData.pending_months}
                  </Text>
                </View>
                <View style={styles.settlementRow}>
                  <Text style={styles.settlementLabel}>Balance Due:</Text>
                  <Text style={styles.settlementValue}>
                    ₹{settlementData.balance_due_amount}
                  </Text>
                </View>

                <View style={styles.settlementRow}>
                  <Text style={styles.settlementLabel}>Total Late-Days:</Text>
                  <Text style={styles.settlementValue}>{lateDate}</Text>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Paid Amount"
                  keyboardType="numeric"
                  value={paidAmount}
                  onChangeText={setPaidAmount}
                />

                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.datePickerButtonText}>
                    {formatDate(settlementDate)}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={settlementDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}

                <View style={styles.doubleInputRow}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Additional Charge"
                    keyboardType="numeric"
                    value={additionalCharge}
                    onChangeText={setAdditionalCharge}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Adjustment"
                    keyboardType="numeric"
                    value={adjustment}
                    onChangeText={setAdjustment}
                  />
                </View>

                {/* 🔹 Final Settle Amount as Text field */}
                <View style={styles.settlementRow}>
                  <Text style={styles.settlementLabel}>
                    Final Settle Amount:
                  </Text>
                  <Text style={styles.settlementValue}>
                    ₹{finalSettleAmount}
                  </Text>
                </View>

                <View style={styles.modalButtonContainer}>
                  <Button
                    mode="contained"
                    style={styles.modalButton}
                    onPress={() => setSettlementModalVisible(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={handleSettlementSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Submit
                  </Button>
                </View>

                <TouchableOpacity
                  style={styles.downloadReceiptButton}
                  onPress={() =>
                    handleDownloadFullBalanceReceipt(settlementData.loan_id)
                  }
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons
                        name="file-download"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.downloadReceiptButtonText}>
                        Download Full Balance Receipt
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.errorText}>
                Failed to load settlement data
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

  function renderItem({ item }: { item: any }) {
    const isExpanded = expandedItemId === item.loan_id;

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.itemHeader}
          onPress={() => toggleExpand(item.loan_id)}
        >
          <View style={styles.iconContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={async () => {
                try {
                  const loanId = item?.loan_id ?? "";
                  // console.log("Attempting to fetch loan details for ID:", loanId);

                  if (!loanId) {
                    console.warn("Invalid loanId - empty or undefined");
                    return;
                  }

                  const loanData = await fetchLoanDetail(loanId);

                  if (loanData) {
                    // Pass as a JSON string or object
                    router.replace({
                      pathname: "/EditLoan",
                      params: { loanData: JSON.stringify(loanData) },
                    });
                  }
                  // console.log("Received loanData:", {
                  //   data: loanData,
                  //   type: typeof loanData,
                  //   stringified: JSON.stringify(loanData, null, 2)
                  // });

                  if (loanData) {
                    // console.log("Loan ID in data:", loanData.vehicle_exterior_photo_front_base64);
                    // console.log("Customer Name:", loanData.customer_name || loanData.user_name);
                    // console.log("Loan Amount:", loanData.loan_amount);
                    // Uncomment when ready to navigate
                    // router.push({
                    //   pathname: "/EditLoan",
                    //   params: { loanData: JSON.stringify(loanData) },
                    // });
                  } else {
                    console.warn("Received empty loanData");
                  }
                } catch (error) {
                  console.error("Error in onPress handler:", {
                    error: error,
                    message: error.message,
                    stack: error.stack,
                  });
                }
              }}
            >
              <Ionicons name="pencil" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.itemTitle}>{item.loan_id}</Text>
            <Text style={styles.itemTitle}>{item.customer_name}</Text>
          </View>
          <Text style={styles.arrow}>{isExpanded ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {isExpanded && loanDetails && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Customer ID</Text>
              <Text style={styles.detailsText}>
                {loanDetails?.user_id || "N/A"}
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Customer Name</Text>
              <Text style={styles.detailsText}>
                {loanDetails?.customer_name || "N/A"}
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Loan ID</Text>
              <Text style={styles.detailsText}>
                {loanDetails.loan_id || "N/A"}
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Loan Amount</Text>
              <Text style={styles.detailsText}>
                {loanDetails.loan_amount || "N/A"}
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Total Loan Amount</Text>
              <Text style={styles.detailsText}>
                {loanDetails.total_amount || "N/A"}
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Loan Create Date</Text>
              <Text style={styles.detailsText}>
                {formatDate(loanDetails.created_at)}
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Loan Date</Text>
              <Text style={styles.detailsText}>
                {formatDate(loanDetails.loan_date)}
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Loan Closed Date</Text>
              <Text style={styles.detailsText}>
                {formatDate(loanDetails.loan_closed_date)}
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Status</Text>
              <Text style={styles.detailsText}>
                {loanDetails.status || "N/A"}
              </Text>
            </View>

            <View style={styles.downloadContainer}>
              <Text style={styles.downloadText}>Download</Text>
              <TouchableOpacity
                style={styles.downloadIcon}
                onPress={() => handleDownloadReceipt(loanDetails.loan_id)}
              >
                <MaterialIcons name="file-download" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.btnContainer}>
              <Button
                mode="contained"
                style={styles.viewBtn}
                onPress={() =>
                  navigation.navigate("ViewLoanDue", {
                    id: loanDetails.loan_id,
                  })
                }
              >
                View Dues
              </Button>

              <Button
                mode="contained"
                style={styles.settlementBtn}
                onPress={() => handleOpenSettlementModal(loanDetails.loan_id)}
              >
                Settlement
              </Button>
            </View>
          </View>
        )}
      </View>
    );
  }
};

export default ExpandableListItem;

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
  doubleInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 5,
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
    borderColor: "white",
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  iconButton: {
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  listContainer: {
    marginTop: 30,
    paddingBottom: 180,
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
    paddingHorizontal: 12,
  },
  settlementBtn: {
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  downloadContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  downloadText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  downloadIcon: {
    backgroundColor: "#0D1B2A",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#14274E",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  settlementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  settlementLabel: {
    color: "#F4C10F",
    fontWeight: "bold",
  },
  settlementValue: {
    color: "#fff",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    color: "#000",
  },
  datePickerButton: {
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  datePickerButtonText: {
    color: "#000",
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
  },
  errorText: {
    color: "#ff4d4d",
    textAlign: "center",
    marginVertical: 20,
  },
  downloadReceiptButton: {
    flexDirection: "row",
    backgroundColor: "#0D1B2A",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    gap: 10,
  },
  downloadReceiptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
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
//codeee