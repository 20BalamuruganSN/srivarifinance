import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Keyboard,
  Modal,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";

import Ionicons from '@expo/vector-icons/Ionicons';

import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { Button, TextInput, Avatar } from "react-native-paper";

import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImageManipulator from "expo-image-manipulator";
import api from "./Api";
import * as ImagePicker from "expo-image-picker";

import { Picker } from "@react-native-picker/picker";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import axios from "axios";

// Your SearchableDropdown component remains unchanged
function SearchableDropdown({ items, placeholder, onItemSelect }) {
  const [searchText, setSearchText] = useState("");
  const [filteredItems, setFilteredItems] = useState(items);
  const [isDropdownVisible, setDropdownVisible] = useState(false);

 const handleSearch = (text) => {
  setSearchText(text);
  
  const filteredData = items.filter((item) => {
    const nameMatch = item.user_name.toLowerCase().includes(text.toLowerCase());
    const idMatch = item.user_id.toLowerCase().includes(text.toLowerCase());
    return nameMatch || idMatch;
  });
  
  setFilteredItems(filteredData);
  setDropdownVisible(true);
};
  const handleItemPress = (item) => {
    setSearchText(item.user_name);
    setDropdownVisible(false);
    onItemSelect(item.user_id);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container1}>
      <TextInput
        style={styles.input}
        placeholder={placeholder || "Search..."}
        value={searchText}
        onChangeText={handleSearch}
        mode="outlined"
        onFocus={() => setDropdownVisible(true)}
      />

      {isDropdownVisible && filteredItems.length > 0 ? (
        <ScrollView style={styles.dropdown}>
          {filteredItems.map((item) => (
            <TouchableOpacity
              key={item.user_id.toString()}
              style={styles.item}
              onPress={() => handleItemPress(item)}
            >
              <Text style={styles.itemText}>{`${item.user_name}_${item.user_id}`}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        isDropdownVisible && (
          <Text style={styles.noResultsText}>No results found</Text>
        )
      )}
    </View>
  );
}

export default function Loan() {
  
  const [showLoanDatePicker, setShowLoanDatePicker] = useState(false);
  const [showLoanCloseDatePicker, setShowLoanCloseDatePicker] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState("Category names");
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loanData, setLoanData] = useState(null);
  const [tenure_month, setTenure] = useState('');
  const [interest_percentage, setInterest] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [monthlyDue, setMonthlyDue] = useState(0);
  const [interestAmount, setInterestAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  console.log("tenure", tenure_month);
  const [vinError, setVinError] = useState("");

  const [formData, setFormData] = useState({
    loan_id: "",
    user_id: "",
    category_id: "",
    duration: "",
    loan_amount: '', 
    status: "Status",
    image: "",
    tenure_month: "",
    interest_percentage: "", 
    loan_date: "Select Date",
    loan_close_date: "",
    employee_id: "",
    total_amount: "",
    due_amount: "",
    segment: "",
    vehicle_make: "",
    vehicle_model: "",
    year_of_manufacture: "",
    VIN_number: "",
    chassis_number: "",
    engine_number: "",
   
    vehicle_exterior_photo_front: "",
    vehicle_exterior_photo_back: "",
    vehicle_exterior_photo_left: "",
    vehicle_exterior_photo_right: "",
    odometer_reading_photo: "",
    VIN_plate_number_photo: "",
    engine_number_photo: "",
    chassis_number_photo: "",
  });

  const [errors, setErrors] = useState({
    loan_id: "",
    category_id: "",
    user_id: "",
    loan_amount: "",
    loan_date: "",
    loan_close_date: "",
    image: "",
    segment: "",
    vehicle_make: "",
    vehicle_model: "",
    year_of_manufacture: "",
    VIN_number: "",
    chassis_number: "",
    engine_number: "",
    vehicle_exterior_photo_front: "",
    vehicle_exterior_photo_back: "",
    vehicle_exterior_photo_left: "",
    vehicle_exterior_photo_right: "",
    odometer_reading_photo: "",   
    chassis_number_photo: "",
  });

  const [modalVisible, setModalVisible] = useState({
    vehicle_exterior_photo_front: false,
    vehicle_exterior_photo_back: false,
    vehicle_exterior_photo_left: false,
    vehicle_exterior_photo_right: false,
    odometer_reading_photo: false,
    chassis_number_photo: false,
    image: false,
  });

  const [currentImageType, setCurrentImageType] = useState("");
  const [Id, setId] = useState("");
  const [isFieldsVisible, setIsFieldsVisible] = useState(false);
  const [categorydata, setCategoryData] = useState<any[]>([]);
  const [customerdata, setCustomerData] = useState<any[]>([]);
  const [makes, setMakes] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  // Format numbers with commas
  const formatNumber = (num) => (num ? num.toLocaleString() : '0');

  const navigation = useNavigation();

  // -------- Modal handling functions --------
  const openModal = (imageType) => {
    setCurrentImageType(imageType);
    setModalVisible({
      ...modalVisible,
      [imageType]: true,
    });
  };

  const closeModal = (imageType) => {
    setModalVisible((prevState) => ({
      ...prevState,
      [imageType]: false,
    }));
    setCurrentImageType("");
  };

  // -------- Image picking function --------
  const pickImage = async (source) => {
    // Close modal
    setModalVisible((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => (newState[key] = false));
      return newState;
    });

    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert(
        "Permission Denied",
        `Permissions are required to access the ${source}.`
      );
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1 });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;

      if (Platform.OS === "web") {
        setFormData((prevData) => ({
          ...prevData,
          [currentImageType]: imageUri,
        }));
      } else {
        try {
          const resizedImage = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 800 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );

          const asset = await MediaLibrary.createAssetAsync(resizedImage.uri);
          await MediaLibrary.createAlbumAsync("MyAppImages", asset, false);

          const base64Image = await FileSystem.readAsStringAsync(resizedImage.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          setFormData((prevData) => ({
            ...prevData,
            [currentImageType]: `data:image/jpeg;base64,${base64Image}`,
          }));
        } catch (error) {
          console.error("Error processing the image:", error);
          Alert.alert("Error", "Failed to process the image.");
        }
      }
    }
  };

  // -------- Validation & Submit --------
  const validateForm = () => {
    let valid = true;
    let newErrors = { ...errors };
    if (!formData.loan_amount || formData.loan_amount.trim() === "") {
      newErrors.loan_amount = "Loan amount is required.";
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const submitLoanData = async (data) => {
    console.log("Submitting loan data:", data);
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
          formData.append(key, data[key]);
        }
      });
      const response = await axios.post("http://192.168.1.20:8000/api/loans", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 15000,
      });
      console.log("Loan data response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error submitting loan data:", error);
      if (error.response) {
        throw new Error(error.response.data.message || "Loan submission failed");
      } else if (error.request) {
        throw new Error("No response from server");
      } else {
        throw new Error(error.message || "Unknown error");
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const updatedData = {
      ...formData,
      loan_amount: formData.loan_amount,
      tenure_month: tenure_month,
      interest_percentage: interest_percentage,
    };

    setLoading(true);
    try {
      const loanData = await submitLoanData(updatedData);
      // console.log("LonData",loanData)
      if (loanData && loanData.loan) {
        setVisible(true);
        Alert.alert(
          "Success",
          `Remember the loan ID: ${loanData.loan.loan_id.toString()}`,
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("ViewLoan", { loanId: loanData.loan.loan_id }),
            },
          ]
        );
      } else {
        Alert.alert("Error", "Loan ID not found in the response.");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // -------- Fetch data on focus --------
  useFocusEffect(
    React.useCallback(() => {
      const fetchCustomerData = async () => {
        setLoading(true);
        try {
          const response = await api.get("/customerindex");
          setCustomerData(response.data.message);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      };

      const fetchCategoryData = async () => {
        setLoading(true);
        try {
          const response = await api.get("/loan-category");
          setCategoryData(response.data.message);
        } catch (error) {
          console.error("Error fetching category data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchCustomerData();
      fetchCategoryData();
    }, [])
  );

  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem("userid");
      if (storedRole) {
        setId(storedRole);
        handleInputChange("employee_id", storedRole);
      }
    };
    fetchRole();
  }, []);

  const handleInputChange = (field, value) => {
  setFormData((prev) => ({
    ...prev,
    [field]: value,
  }));
};


  const handleItemSelect = (userId) => {
    handleInputChange("user_id", userId);
  };

  const fetchMakesBySegment = async (segment) => {
    try {
      const response = await api.get(`/vehicle-makes`, { params: { segment } });
      setMakes(response.data);
    } catch (error) {
      console.error("Error fetching vehicle makes:", error);
    }
  };

  const handleInputChanges = (field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));

    if (field === "segment") {
      setFormData((prevData) => ({
        ...prevData,
        vehicle_make: "",
        vehicle_model: "",
      }));
      setMakes([]);
      setModels([]);
      fetchMakesBySegment(value);
    }

    if (field === "vehicle_make") {
      setFormData((prevData) => ({
        ...prevData,
        vehicle_model: "",
      }));
      setModels([]);
    }
  };
const onLoanDateChange = async (event, selectedDate) => {
  if (selectedDate) {
    const formattedDate = selectedDate.toISOString().split("T")[0];
    console.log("Selected Loan Date:", formattedDate);
    handleInputChanges("loan_date", formattedDate);

    if (tenure_month && !isNaN(Number(tenure_month))) {
      console.log("Sending to backend:", {
        loan_date: formattedDate,
        tenure_month: Number(tenure_month),
      });

      try {
        const response = await fetch("http://192.168.1.20:8000/api/calculate-loan-close-date", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            loan_date: formattedDate,
            tenure_month: Number(tenure_month),
          }),
        });

        const data = await response.json();
        console.log("Backend Response:", data);

      if (data.loan_close_date) {
  handleInputChanges("loan_close_date", data.loan_close_date); // Add the "d" here
}

      } catch (error) {
        console.error("Loan closed date fetch failed:", error);
      }
    } else {
      console.warn("Tenure month is missing or invalid");
    }
  }
};

const onLoanCloseDateChange = (event, selectedDate) => {
  if (selectedDate) {
    const formattedDate = selectedDate.toISOString().split("T")[0];
    handleInputChanges("loan_close_date", formattedDate);
  }
};

  const [loanAmount, setLoanAmount] = useState('');
  const [totalLoanAmount, setTotalLoanAmount] = useState(0);

const loancalculations = async () => {
  setLoading(true);
  try {
    const response = await api.post('loan/calculate', {
      loan_amount: loanAmount,
      tenure_month: tenure_month,
      interest_percentage: interest_percentage,
    });

   
    console.log('API Response:', response);

    

    const data = typeof response.data === 'string'
      ? JSON.parse(response.data)
      : response.data;

    const { interest_amount, total_amount, monthly_due } = data;

    setInterestAmount(Number(interest_amount));
    setTotalAmount(Number(total_amount));
    setMonthlyDue(Number(monthly_due));
  } catch (error) {
    Alert.alert('Error', 'Failed to calculate loan.');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    console.log('Updated formData:', formData);
  }, [formData]);

  return (
    <ScrollView>
     
      <View style={styles.container}>
        <Text style={styles.headerText}>Loan Form</Text>

        {/* Customer Search Dropdown */}
        <SearchableDropdown
          items={customerdata}
          placeholder="Customer Name... or user ID"
          onItemSelect={handleItemSelect}
        />

        {/* Vehicle section */}
        <View style={styles.vehiclecontainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsFieldsVisible(!isFieldsVisible)}
          >
            <Text style={styles.buttonText}>
              <Ionicons name="car" size={20} color="#fff" /> Add Vehicle Loan
            </Text>
          </TouchableOpacity>

          {isFieldsVisible && (
            <View style={styles.addcontainer}>
              {/* Segment Picker */}
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.segment}
                  style={styles.inputPicker}
                  onValueChange={(value) => handleInputChanges('segment', value)}
                >
                  <Picker.Item label="Select Segment" value="" />
                  <Picker.Item label="Two Wheeler" value="Two Wheeler" />
                  <Picker.Item label="Three Wheeler - Auto" value="Three Wheeler - Auto" />
                  <Picker.Item label="Three Wheeler - Load Auto" value="Three Wheeler - Load Auto" />
                  <Picker.Item label="Four Wheeler" value="Four Wheeler" />
                </Picker>
              </View>

              {/* Vehicle Make Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Vehicle Maker"
                  value={formData.vehicle_make}
                  onChangeText={(value) => handleInputChanges('vehicle_make', value)}
                />
              </View>

              {/* Year of Manufacture Dropdown */}
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.year_of_manufacture}
                  style={styles.dropdown}
                  onValueChange={(value) => handleInputChange('year_of_manufacture', value)}
                >
                  <Picker.Item label="Year of Manufacture" value="" />
                  {[...Array(30)].map((_, i) => {
                    const year = 2025 - i;
                    return <Picker.Item label={`${year}`} value={year} key={year} />;
                  })}
                </Picker>
              </View>

              {/* VIN Number with placeholder and helper text */}
              <TextInput
                mode="outlined"
                label="Vehicle Identification Number"
                placeholder="Ex: TN01AB1234"
                value={formData.VIN_number}
                style={styles.input}
                onChangeText={(text) => {
                  let filteredText = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
                  if (filteredText.length > 17) {
                    filteredText = filteredText.substring(0, 17);
                    setVinError("VIN cannot exceed 17 characters");
                  } else {
                    setVinError("");
                  }
                  setFormData((prev) => ({ ...prev, VIN_number: filteredText }));
                  if (text !== filteredText) {
                    setVinError("Only uppercase letters and numbers are allowed");
                  }
                }}
                right={
                  <TextInput.Icon icon={() => <Ionicons name="alpha-v" size={24} color="black" />} />
                }
              />
              {vinError !== "" && <Text style={styles.errorText}>{vinError}</Text>}

              {/* Engine Number */}
              <TextInput
                mode="outlined"
                label="Chassis Number"
                value={formData.engine_number}
                style={styles.input}
                onChangeText={(value) => handleInputChange('engine_number', value)}
              />

              {/* 3x2 Photo Grid for vehicle images */}
              <View style={{ flexDirection: 'column' }}>
                {/* Row 1 */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
                  {/* Front Photo */}
                  <View style={{ alignItems: 'center' }}>
                    {/* Button to open modal for Front Photo */}
                    <Button
                      onPress={() => openModal('vehicle_exterior_photo_front')}
                      style={styles.filebutton}
                      icon={({ color, size }) => <Ionicons name="camera" size={15} color="#fff" />}
                    >
                      <Text style={{ color: 'white' }}>FrontPhoto</Text>
                    </Button>
                    {/* Show selected front photo */}
                    {formData.vehicle_exterior_photo_front ? (
                      <Avatar.Image
                        size={55}
                        source={{ uri: formData.vehicle_exterior_photo_front }}
                        style={styles.avatar}
                      />
                    ) : null}
                  </View>
                  {/* Back Photo */}
                  <View style={{ alignItems: 'center' }}>
                    {/* Button to open modal for Back Photo */}
                    <Button
                      onPress={() => openModal('vehicle_exterior_photo_back')}
                      style={styles.filebutton}
                      icon={({ color, size }) => <Ionicons name="camera" size={15} color="#fff" />}
                    >
                      <Text style={{ color: 'white' }}>Back Photo</Text>
                    </Button>
                    {formData.vehicle_exterior_photo_back ? (
                      <Avatar.Image
                        size={55}
                        source={{ uri: formData.vehicle_exterior_photo_back }}
                        style={styles.avatar}
                      />
                    ) : null}
                  </View>
                </View>
                {/* Row 2 */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
                  {/* Left Photo */}
                  <View style={{ alignItems: 'center' }}>
                    <Button
                      onPress={() => openModal('vehicle_exterior_photo_left')}
                      style={styles.filebutton}
                      icon={({ color, size }) => <Ionicons name="camera" size={15} color="#fff" />}
                    >
                      <Text style={{ color: 'white' }}>Left Photo</Text>
                    </Button>
                    {formData.vehicle_exterior_photo_left ? (
                      <Avatar.Image
                        size={55}
                        source={{ uri: formData.vehicle_exterior_photo_left }}
                        style={styles.avatar}
                      />
                    ) : null}
                  </View>
                  {/* Right Photo */}
                  <View style={{ alignItems: 'center' }}>
                    <Button
                      onPress={() => openModal('vehicle_exterior_photo_right')}
                      style={styles.filebutton}
                      icon={({ color, size }) => <Ionicons name="camera" size={15} color="#fff" />}
                    >
                      <Text style={{ color: 'white' }}>Right Photo</Text>
                    </Button>
                    {formData.vehicle_exterior_photo_right ? (
                      <Avatar.Image
                        size={55}
                        source={{ uri: formData.vehicle_exterior_photo_right }}
                        style={styles.avatar}
                      />
                    ) : null}
                  </View>
                </View>
                {/* Row 3 */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
                  {/* Dashboard Photo */}
                  <View style={{ alignItems: 'center' }}>
                    <Button
                      onPress={() => openModal('odometer_reading_photo')}
                      style={styles.filebutton}
                      icon={({ color, size }) => <Icon name="camera" size={15} color="#fff" />}
                    >
                      <Text style={{ color: 'white' }}>Dashboard</Text>
                    </Button>
                    {formData.odometer_reading_photo ? (
                      <Avatar.Image
                        size={55}
                        source={{ uri: formData.odometer_reading_photo }}
                        style={styles.avatar}
                      />
                    ) : null}
                  </View>
                  {/* Chassis Photo */}
                  <View style={{ alignItems: 'center' }}>
                    <Button
                      onPress={() => openModal('chassis_number_photo')}
                      style={styles.filebutton}
                      icon={({ color, size }) => <Icon name="camera" size={15} color="#fff" />}
                    >
                      <Text style={{ color: 'white' }}>Chasisphoto </Text>
                    </Button>
                    {formData.chassis_number_photo ? (
                      <Avatar.Image
                        size={55}
                        source={{ uri: formData.chassis_number_photo }}
                        style={styles.avatar}
                      />
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Loan Amount & Tenure */}
          <TextInput
            style={styles.input}
            label="Loan Amount"
            value={loanAmount}
            onChangeText={(value) => {
              setLoanAmount(value);
              handleInputChange('loan_amount', value);
            }}
            keyboardType="numeric"
          />
<TextInput 
  style={styles.input}
  label="Tenure (Months)"
  value={tenure_month}
  onChangeText={(value) => {
    setTenure(value);
    handleInputChange("tenure_month", value);

    // 🔁 Trigger loan closed date calculation if loan_date is already selected
    if (formData.loan_date && !isNaN(new Date(formData.loan_date))) {
      onLoanDateChange(null, new Date(formData.loan_date));
    }
  }}
  keyboardType="numeric"
/>
          <TextInput
            style={styles.input}
            label="Interest (%)"
            value={interest_percentage}
            onChangeText={(value) => {
              setInterest(value);
              handleInputChange('interest_percentage', value);
            }}
            keyboardType="numeric"
          />

          {/* Calculate Button */}
          <View style={{ padding: 20 }}>
            <Button mode="contained" onPress={loancalculations} loading={loading} style={{ backgroundColor: '#FFC107' }}>
              Calculate Loan
            </Button>
            {loading ? (
              <Text style={styles.loadingText}>Calculating...</Text>
            ) : (
              <>
                {totalAmount > 0 && (
                  <View style={styles.resultCard}>
                    <TextInput
                      label="Interest Amount"
                      value={`₹${formatNumber(interestAmount)}`}
                      editable={false}
                      style={styles.input}
                    />
                    <TextInput
                      label="Total Amount"
                      value={`₹${formatNumber(totalAmount)}`}
                      editable={false}
                      style={styles.input}
                    />
                    <TextInput
                      label="Monthly EMI"
                      value={`₹${formatNumber(monthlyDue)}`}
                      editable={false}
                      style={styles.input}
                    />
                  </View>
                )}
              </>
            )}
          </View>

          {/* Dates */}
          <TextInput
  mode="outlined"
  label="Next Due Date"
  value={formData.loan_date}
  editable={false}
  style={styles.input}
  right={
    <TextInput.Icon
      icon={() => <Icon name="calendar" size={24} color="black" />}
      onPress={() => setShowLoanDatePicker(true)}
    />
  }
/>
{showLoanDatePicker && (
  <DateTimePicker
    value={
      formData.loan_date && !isNaN(new Date(formData.loan_date))
        ? new Date(formData.loan_date)
        : new Date()
    }
    mode="date"
    display="default"
    onChange={(event, selectedDate) => {
      setShowLoanDatePicker(false);
      onLoanDateChange(event, selectedDate);
    }}
  />
)}

{errors.loan_date && <Text style={styles.errorText}>{errors.loan_date}</Text>}

<TextInput
  importantForAutofill="yes"
  mode="outlined"
  label="Loan Closed Date"
  value={formData.loan_close_date}
  editable={false}
  style={styles.input}
  right={
    <TextInput.Icon
      icon={() => <Icon name="calendar" size={24} color="black" />}
      onPress={() => setShowLoanCloseDatePicker(true)}
    />
  }
/>
{/* {showLoanCloseDatePicker && (
  <DateTimePicker
    value={
      formData.loan_close_date && !isNaN(new Date(formData.loan_close_date))
        ? new Date(formData.loan_close_date)
        : new Date()
    }
    mode="date"
    display="default"
    onChange={(event, selectedDate) => {
      setShowLoanCloseDatePicker(false);
      onLoanCloseDateChange(event, selectedDate);
    }}
  />
)} */}

{errors.loan_close_date && <Text style={styles.errorText}>{errors.loan_close_date}</Text>}

          {/* Status Picker */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.status}
              style={styles.inputPicker}
              onValueChange={(itemValue) => handleInputChange('status', itemValue)}
            >
              <Picker.Item label="Status" />
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="In Progress" value="inprogress" />
              <Picker.Item label="Completed" value="completed" />
              <Picker.Item label="Cancelled" value="cancelled" />
              <Picker.Item label="Preclose" value="preclose" />
            </Picker>
          </View>
          {errors.status && <Text style={styles.errorText}>{errors.status}</Text>}

          {/* Employee ID */}
          <TextInput
            mode="outlined"
            label="Ref Employee ID"
            value={Id}
            style={styles.input}
            editable={false}
          />

          {/* Transaction Proof & Photo */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {formData.image ? (
              <Avatar.Image size={90} source={{ uri: formData.image }} style={styles.avatar} />
            ) : null}
            <Button
              onPress={() => openModal('image')}
              icon={({ color, size }) => <Icon name="camera" size={20} color="#07387A" />}
              style={[styles.filebuttons, { width: 320 }]}
            >
              <Text style={{ color: '#07387A' }}>Transaction Proof</Text>
            </Button>
          </View>
          {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}

          {/* Success Popup */}
          {visible && (
            <Animated.View style={[styles.popup, { opacity: fadeAnim }]}>
              <Text style={styles.popupText}>Loan Added Successfully!</Text>
            </Animated.View>
          )}

          {/* Submit Button */}
          <Button mode="contained" onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitbuttonText}>Add Loan</Text>
          </Button>
        </View>
      </View>

      {/* Modal for Image Selection */}
      <Modal
        visible={Object.values(modalVisible).some((v) => v)}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible({
            vehicle_exterior_photo_front: false,
            vehicle_exterior_photo_back: false,
            vehicle_exterior_photo_left: false,
            vehicle_exterior_photo_right: false,
            odometer_reading_photo: false,
            chassis_number_photo: false,
            image: false,
          });
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Image Source</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => pickImage("camera")}
            >
              <Text style={styles.modalButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => pickImage("gallery")}
            >
              <Text style={styles.modalButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => {
                setModalVisible({
                  vehicle_exterior_photo_front: false,
                  vehicle_exterior_photo_back: false,
                  vehicle_exterior_photo_left: false,
                  vehicle_exterior_photo_right: false,
                  odometer_reading_photo: false,
                  chassis_number_photo: false,
                  image: false,
                });
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container1: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff', 
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dropdown: {
    marginTop: 5,
    maxHeight: 200, // Adjust height as needed
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  noResultsText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  container: {
    padding: 20,
    backgroundColor: '#07387A',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  vehiclecontainer: {
    marginVertical: 10,
  },
  addButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  addcontainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
  },
  inputPicker: {
    height: 50,
    width: '100%',
  },
  inputContainer: {
    marginVertical: 8,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dropdown: {
    height: 50,
    width: '100%',
  },
  filebuttons: {
    backgroundColor: '#fff',
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  filebutton: {
    backgroundColor: "#14274E",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  avatar: {
    marginLeft: 10,
    marginVertical: 8,
  },
  resultCard: {
    backgroundColor: "#14274E",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  popup: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    backgroundColor: '#4BB543',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 1000,
  },
  popupText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#FFC107',
  },
  submitbuttonText: {
    color: '#fff',
    fontSize: 16,
  },
  // Helper text style for VIN guidance
  helperText: {
    fontSize: 12,
    color: 'gray',
    marginLeft: 10,
    marginTop: 2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalButton: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#14274E",
    borderRadius: 8,
    marginVertical: 5,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
  },
  modalCancel: {
    marginTop: 10,
  },
  modalCancelText: {
    color: "red",
    fontSize: 16,
  },
});