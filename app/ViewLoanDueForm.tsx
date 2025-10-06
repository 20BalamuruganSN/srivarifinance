import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "./Api";

import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ViewLoanDueForm = () => {
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showPaidDatePicker, setShowPaidDatePicker] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showMessage, setShowMessage] = useState(false); // for bottom message
  const route = useRoute();
  const navigation = useNavigation();

  const {
    id: {
      collection_by,
      created_at,
      due_amount,
      due_date,
      id,
      loan_id,
      next_amount,
      paid_amount,
      paid_on,
      pending_amount,
      status,
      updated_at,
      user_id,
      user_name,
    },
  } = route.params;

  const [formData, setFormData] = useState({
    loan_id: loan_id,
    user_id: user_id,
    due_amount: due_amount,
    collection_by: collection_by || "",
    due_date: due_date || "Select Date",
    paid_on: paid_on || "Select Date",
    paid_amount: paid_amount,
    status: status,
    user_name: user_name || "",
    next_amount: next_amount,
    future_date: "",
    pending_amount: pending_amount,
  });

  const [errors, setErrors] = useState({
    loan_id: "",
    user_id: "",
    due_amount: "",
    collection_by: "",
    due_date: "",
    paid_on: "",
    paid_amount: "",
    status: "unpaid",
  });

  const handleInputChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = { ...errors };

    if (!formData.loan_id) {
      newErrors.loan_id = "Loan ID is required";
      valid = false;
    }
    if (!formData.user_id) {
      newErrors.user_id = "ID is required";
      valid = false;
    }
    if (!formData.due_amount) {
      newErrors.due_amount = "Due amount is required";
      valid = false;
    } else if (parseFloat(formData.due_amount) <= 0) {
      newErrors.due_amount = "Due amount must be greater than 0";
      valid = false;
    }
    if (!formData.collection_by) {
      newErrors.collection_by = "Collector is required";
      valid = false;
    }

    if (formData.due_date === "Select Date") {
      newErrors.due_date = "Due date is required";
      valid = false;
    }

    // Validate paid_on and paid_amount
    if (!formData.paid_amount || formData.paid_amount.trim() === "") {
      newErrors.paid_amount = "Paid amount is required";
      valid = false;
    } else if (parseFloat(formData.paid_amount) <= 0) {
      newErrors.paid_amount = "Paid amount must be greater than 0";
      valid = false;
    }

    if (formData.paid_on === "Select Date" || !formData.paid_on) {
      newErrors.paid_on = "Paid date is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Show message at bottom
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    // Calculate pending amount
    const paidAmt = parseFloat(formData.paid_amount);
    const dueAmt = parseFloat(formData.due_amount);
    let pendingAmt = dueAmt - paidAmt;

    if (pendingAmt < 0) pendingAmt = 0; // prevent negative

    // Add pending amount to formData for API
    const updatedData = {
      ...formData,
      pending_amount: pendingAmt.toString(),
    };

    try {
      setLoading(true);
      const response = await api.put(`/checkloancategory/${formData.loan_id}`, updatedData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 200) {
        setVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            setVisible(false);
            navigation.goBack(); // Navigate back to ViewLoanDue page
          }, 2000);
        });
      } else {
        Alert.alert("Error", response.data.message || "Failed to update");
      }
    } catch (error: any) {
      console.error("Error:", error);
      Alert.alert("Error", error.response?.data?.error || "Server Error");
    } finally {
      setLoading(false);
    }
  };

  const onDueDateChange = (event: any, selectedDate: any) => {
    setShowDueDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      handleInputChange("due_date", formatDate(selectedDate));
    }
  };

  const onPaidDateChange = (event: any, selectedDate: any) => {
    setShowPaidDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      handleInputChange("paid_on", formatDate(selectedDate));
    }
  };

  const formatDate = (date: any) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fetch collection_by on mount
  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem("userid");
      if (storedRole) {
        handleInputChange("collection_by", storedRole);
      }
    };
    fetchRole();
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <TextInput
              mode="outlined"
              value={formData.loan_id}
              label="Loan ID"
              editable={false}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              value={formData.user_id}
              label="Customer ID"
              editable={false}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              value={formData.user_name}
              label="Customer Name"
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              value={formData.next_amount || formData.due_amount}
              keyboardType="numeric"
              label="Due Amount"
              style={styles.input}
              onChangeText={(value) => handleInputChange("due_amount", value)}
            />

            <TextInput
              mode="outlined"
              value={formData.paid_amount}
              keyboardType="numeric"
              label="Paid Amount"
              style={styles.input}
              onChangeText={(value) => handleInputChange("paid_amount", value)}
            />
            {errors.paid_amount ? (
              <Text style={styles.errorText}>{errors.paid_amount}</Text>
            ) : null}

            {/* Due Date Picker */}
            <View style={styles.dateContainer}>
              <TextInput
                mode="outlined"
                label="Due Date"
                value={formData.due_date.split("T")[0]}
                editable={false}
                style={styles.inputdate}
              />
              <Button
                mode="outlined"
                onPress={() => setShowDueDatePicker(true)}
                style={styles.button}
              >
                Select Due Date
              </Button>
              {showDueDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={onDueDateChange}
                />
              )}
            </View>

            {/* Paid Date Picker */}
            <View style={styles.dateContainer}>
              <TextInput
                mode="outlined"
                label="Paid Date"
                value={formData.paid_on}
                editable={false}
                style={styles.inputdate}
              />
              <Button
                mode="outlined"
                onPress={() => setShowPaidDatePicker(true)}
                style={styles.button}
              >
                Select Paid Date
              </Button>
              {showPaidDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={onPaidDateChange}
                />
              )}
            </View>
            {errors.paid_on ? (
              <Text style={styles.errorText}>{errors.paid_on}</Text>
            ) : null}

            <TextInput
              mode="outlined"
              label="Collected By"
              value={formData.collection_by}
              style={styles.input}
              onChangeText={(value) => handleInputChange("collection_by", value)}
            />

            {visible && (
              <Animated.View style={[styles.popup, { opacity: fadeAnim }]}>
                <Text style={styles.popupText}>Loan Due Updated Successfully!</Text>
              </Animated.View>
            )}

            {/* Bottom message for missing fields */}
            {showMessage && (
              <View style={styles.bottomMessageContainer}>
                <Text style={styles.bottomMessageText}>Please fill all required fields</Text>
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={loading}
            >
              Update Due
            </Button>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default ViewLoanDueForm;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingBottom: 160,
  },
  headerText: {
    fontSize: 20,
    marginTop: 20,
    marginVertical: 10,
  },
  button: {},
  submitButton: {
    width: 300,
    backgroundColor: "navy",
    padding: 5,
    marginTop: 20,
  },
  input: {
    height: 50,
    width: "100%",
    marginVertical: 10,
  },
  inputdate: {
    height: 50,
    width: "50%",
    marginVertical: 10,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    textAlign: "left",
    alignSelf: "flex-start",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  statusText: {
    color: "#303036",
    fontSize: 16,
    padding: 10,
  },
  radioButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  popup: {
    position: 'absolute',
    top: 20,
    backgroundColor: "navy",
    padding: 15,
    borderRadius: 10,
    alignSelf: 'center',
    zIndex: 1000,
  },
  popupText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomMessageContainer: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  bottomMessageText: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 10,
    borderRadius: 8,
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
  },
});