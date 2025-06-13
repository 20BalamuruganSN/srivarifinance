import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Button, TextInput, RadioButton } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "./Api";

import { useFocusEffect, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const ViewLoanDueForm= () => {
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showPaidDatePicker, setShowPaidDatePicker] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const route = useRoute();

  const { id } = route.params as {
    id: {
      collection_by: string | null;
      created_at: string;
      due_amount: string;
      due_date: string;
      id: number;
      loan_id: string;
      next_amount: string;
      paid_amount: string;
      paid_on: string | null;
      pending_amount: string;
      status: string;
      updated_at: string;
      user_id: string;
      user_name:string

    };
  };
console.log("Id ",id)
  const {
    loan_id,
    user_id,
    due_amount,
    paid_amount,
    next_amount,
    due_date,
    status,
    user_name,
  } = id;

  const [formData, setFormData] = useState({
    loan_id: loan_id,
    user_id: user_id,
    due_amount: due_amount,
    collection_by: "",
    due_date: due_date || "Select Date",
    paid_on: "Select Date",
    paid_amount: paid_amount,
    status: status,
    user_name: user_name || "",
    next_amount: next_amount,
    future_date: "",
  });


  console.log("Cist",user_name)
  console.log("due_amount",due_amount)
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
    if (formData.paid_on === "Select Date") {
      newErrors.paid_on = "Paid date is required";
      valid = false;
    } else if (new Date(formData.paid_on) <= new Date()+1) {
      newErrors.paid_on = "Paid date must be today or in the future";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const today = new Date();
    const paidOnDate = new Date(formData.due_date);

    if (paidOnDate > today) {
      return handleFutureDate();
    }
    setLoading(true);
    try {


      const response = await api.put(
        // `/update-loan-pay/${formData.loan_id}`,
        `/checkloancategory/${formData.loan_id}`,
        formData,
        
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
          //  console.log("customerName",formData)



      if (response.status === 200) {
        setVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }).start();
        
      } else {
        Alert.alert("Error", "Failed to add loan due information.");
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to add loan due information.");
    }finally{
      setLoading(false);
    }
  };

  const handleFutureDate = async () => {
    
   
    const updatedFormData = { ...formData, future_date: formData.due_date };
     setLoading(true);
    try {

      const response = await api.put(
        `/checkloancategory/${updatedFormData.loan_id}`,
        updatedFormData,
        
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setVisible(true);
        Alert.alert("Success", "Loan added successfully!");
        // router.replace('/ViewLoanDue')
      } else {
        Alert.alert("Error", "Failed to update future date.");
      }
    } catch (error: any) {
      Alert.alert("Alert", "First work on unpaid record.");
    }
    finally{
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
    <ScrollView>
      <View style={styles.container}>
      
        <TextInput
          mode="outlined"
          value={formData.loan_id}
          label="Loan ID"
          editable={false}
          style={styles.input}
        />
        {errors.loan_id && (
          <Text style={styles.errorText}>{errors.loan_id}</Text>
        )}

        <TextInput
          mode="outlined"
          value={formData.user_id}
          label="Customer ID"
          editable={false}
          style={styles.input}
        />
        {errors.user_id && (
          <Text style={styles.errorText}>{errors.user_id}</Text>
        )}

        <TextInput
          mode="outlined"
          value={formData.user_name }
          label="Customer Name"
          style={styles.input}
          // onChangeText={(value) => handleInputChange("customer_name", value)}

          // editable={true}
        />

        <TextInput
          mode="outlined"
          value={formData.next_amount || formData.due_amount  }
          keyboardType="numeric"
          label="Due Amount"
          style={styles.input}
          onChangeText={(value) => handleInputChange("due_amount", value)}
        />
        {errors.due_amount && (
          <Text style={styles.errorText}>{errors.due_amount}</Text>
        )}

        <TextInput
          mode="outlined"
          value={formData.paid_amount}
          keyboardType="numeric"
          label="Paid Amount"
          style={styles.input}
          onChangeText={(value) => handleInputChange("paid_amount", value)}
        />
        {errors.paid_amount && (
          <Text style={styles.errorText}>{errors.paid_amount}</Text>
        )}

        <View style={styles.dateContainer}>
          <TextInput
            mode="outlined"
            label="Due Date"
            value={formData.due_date.split('T')[0]}
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
        {errors.due_date && (
          <Text style={styles.errorText}>{errors.due_date}</Text>
        )}
    
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
        {errors.paid_on && (
          <Text style={styles.errorText}>{errors.paid_on}</Text>
        )}
        <TextInput
          mode="outlined"
          label="Collected By"
          value={formData.collection_by}
          style={styles.input}
          onChangeText={(value) => handleInputChange("collection_by", value)}
        />
        {errors.collection_by && (
          <Text style={styles.errorText}>{errors.collection_by}</Text>
        )}

        {visible && (
          <Animated.View style={[styles.popup, { opacity: fadeAnim }]}>
            <Text style={styles.popupText}>Loan Due Created!</Text>
          </Animated.View>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          Add Due
        </Button>
        
      </View>
    </ScrollView>
  );
};

export default ViewLoanDueForm;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#07387A",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  radioGroup: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
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
    marginTop: 10,
    backgroundColor: "navy",
    padding: 10,
    borderRadius: 10,
    bottom:10,
  },
  popupText: {
    color: "#fff",
    fontSize: 16,
  },
});


