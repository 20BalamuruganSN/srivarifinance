import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
  Image,
  BackHandler,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import {
  useLocalSearchParams,
  router,
  useNavigationContainerRef,
  useRouter,
} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Avatar } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useColorScheme } from "react-native";
import { DefaultTheme, DarkTheme } from "@react-navigation/native";

const EditLoan = () => {
  const { loanData } = useLocalSearchParams();
  const parsedLoanData = JSON.parse(loanData);
  const [loan, setLoan] = useState(null);
  const [showLoanDatePicker, setShowLoanDatePicker] = useState(false);
  const [showLoanClosedDatePicker, setShowLoanClosedDatePicker] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoanOlderThan10Days, setIsLoanOlderThan10Days] = useState(false);
  const [compressedEngineImage, setCompressedEngineImage] = useState(null);
  const [calculationResult, setCalculationResult] = useState({
    interestAmount: 0,
    totalAmount: 0,
    monthlyDue: 0,
  });
  const [modalVisible, setModalVisible] = useState({
    vehicle_exterior_photo_front: false,
    vehicle_exterior_photo_back: false,
    vehicle_exterior_photo_left: false,
    vehicle_exterior_photo_right: false,
    odometer_reading_photo: false,
    engine_number_photo: false,
    image: false,
  });
  const [currentImageType, setCurrentImageType] = useState("");
  const [vinError, setVinError] = useState("");
  const [isFieldsVisible, setIsFieldsVisible] = useState(true);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [imageUrl, setImageUrl] = useState("");

  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  const router = useRouter();

  const [canGoBack, setCanGoBack] = useState(false);

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

  // Check if loan is older than 10 days when editing
  useEffect(() => {
    if (loan && loan.loan_date) {
      const loanDate = new Date(loan.loan_date);
      const today = new Date();
      const timeDiff = today.getTime() - loanDate.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      setIsLoanOlderThan10Days(daysDiff > 10);
    } else {
      setIsLoanOlderThan10Days(false);
    }
  }, [loan]);

  // Helper function to compress base64 images
  const compressBase64Image = async (base64Str) => {
    if (!base64Str) return null;
    // Convert base64 to URI
    const uri = `data:image/jpeg;base64,${base64Str}`;
    try {
      const resizedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // resize to width 800px, maintain aspect ratio
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      // Read the compressed image as base64
      const compressedBase64 = await FileSystem.readAsStringAsync(
        resizedImage.uri,
        {
          encoding: FileSystem.EncodingType.Base64,
        }
      );
      return `data:image/jpeg;base64,${compressedBase64}`;
    } catch (error) {
      // console.log("Image compression error:", error);
      return base64Str; // fallback to original if error
    }
  };

  // Initialize data from passed params
  useEffect(() => {
    if (parsedLoanData) {
      try {
        // Debug: Log raw input data first
        // console.log("Raw parsedLoanData:", {
        //   frontImage:
        //     parsedLoanData.vehicle_exterior_photo_front?.slice(0, 50) || "null",
        //   backImage:
        //     parsedLoanData.vehicle_exterior_photo_back?.slice(0, 50) || "null",
        // });

        const parsed =
          typeof parsedLoanData === "string"
            ? JSON.parse(parsedLoanData)
            : parsedLoanData;

        // Wrap in an async IIFE to handle async compression
        (async () => {
          const frontImageCompressed = await compressBase64Image(
            parsed.vehicle_exterior_photo_front_base64
          );
          const backImageCompressed = await compressBase64Image(
            parsed.vehicle_exterior_photo_back_base64
          );
          const leftImageCompressed = await compressBase64Image(
            parsed.vehicle_exterior_photo_left_base64
          );
          const rightImageCompressed = await compressBase64Image(
            parsed.vehicle_exterior_photo_right_base64
          );
          const odometerImageCompressed = await compressBase64Image(
            parsed.odometer_reading_photo_base64
          );
          // const chassisImageCompressed = await compressBase64Image(
          //   parsed.chassis_number_photo_base64
          // );
          console.log(parsed.engine_number_photo);
          const compressedEngineImage = await compressBase64Image(
            parsed.VIN_plate_number_photo 
          );
          console.log("engineImageCompressed", compressedEngineImage);

          const mainImageCompressed = await compressBase64Image(
            parsed.image_base64
          );
          // console.log("MAINiMAGE", mainImageCompressed);

          const loanData = {
            vehicle_exterior_photo_front: frontImageCompressed,
            vehicle_exterior_photo_back: backImageCompressed,
            vehicle_exterior_photo_left: leftImageCompressed,
            vehicle_exterior_photo_right: rightImageCompressed,
            odometer_reading_photo: odometerImageCompressed,
            engine_number_photo: compressedEngineImage,
            image: mainImageCompressed,
            // ... rest remains same
            loan_id: parsed.loan_id || "",
            user_id: parsed.user_id || "",
            employee_id: parsed.employee_id || "",
            customer_name: parsed.customer_name || "",
            segment: parsed.segment || "",
            vehicle_make: parsed.vehicle_make || "",
            vehicle_model: parsed.vehicle_model || "",
            year_of_manufacture: parsed.year_of_manufacture || "",
            VIN_number: parsed.VIN_number || "",
            chassis_number: parsed.chassis_number || "",
            engine_number: parsed.engine_number || "",
            loan_amount: parsed.loan_amount || "",
            interest_percentage: parsed.interest_percentage || "",
            tenure_month: parsed.tenure_month
              ? parsed.tenure_month.toString()
              : "",
            loan_date: parsed.loan_date || "",
            loan_closed_date: parsed.loan_closed_date || "",
            total_amount: parsed.total_amount || "",
            due_amount: parsed.due_amount || "",
            status: parsed.status || "",
            loan_category: parsed.loan_category || "",
          };
          setLoan(loanData);
          setImageUrl(loanData.engine_number_photo);
          // console.log("loan-data", loanData.segment);
          // console.log("year", loanData.year_of_manufacture);
          // console.log("engine_photo", loan.engine_number_photo);

          if (
            parsed.loan_amount &&
            parsed.interest_percentage &&
            parsed.tenure_month
          ) {
            setCalculationResult({
              interestAmount: parsed.total_amount - parsed.loan_amount,
              totalAmount: parsed.total_amount,
              monthlyDue: parsed.total_amount / parsed.tenure_month,
            });
          }

          // Optional: verify images loaded
          setTimeout(() => {
            if (loanData.vehicle_exterior_photo_front) {
              Image.getSize(
                loanData.vehicle_exterior_photo_front,
                (width, height) => {
                  // console.log(
                  //   "Front image loaded successfully - Dimensions:",
                  //   width,
                  //   "x",
                  //   height
                  // );
                },
                (error) => {
                  // console.log("Front image failed to load:", error);
                }
              );
            }
          }, 500);
        })();
      } catch (error) {
        console.error("Error initializing loan data:", error);
        Alert.alert("Error", "Failed to load loan data");
      }
    }
  }, [loanData]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return ""; // invalid date handle

    let day = date.getDate().toString().padStart(2, "0");
    let month = (date.getMonth() + 1).toString().padStart(2, "0");
    let year = date.getFullYear();

    return `${day}-${month}-${year}`; // dd-mm-yyyy
  };

  const formatNumber = (num) => {
    return parseFloat(num)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleChange = (field, value) => {
    // console.log("value of picker", value);

    if (
      isLoanOlderThan10Days &&
      [
        "loan_amount",
        "interest_percentage",
        "tenure_month",
        "loan_date",
      ].includes(field)
    ) {
      return;
    }

    setLoan((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (value && errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const openModal = (imageType) => {
    setCurrentImageType(imageType);
    setModalVisible({
      ...modalVisible,
      [imageType]: true,
    });
  };

  const closeModal = (imageType) => {
    setModalVisible((prev) => ({
      ...prev,
      [imageType]: false,
    }));
    setCurrentImageType("");
  };

  const pickImage = async (source) => {
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
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 1,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: false,
            quality: 1,
          });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;

      if (Platform.OS === "web") {
        handleChange(currentImageType, imageUri);
      } else {
        try {
          const resizedImage = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 800 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );

          const asset = await MediaLibrary.createAssetAsync(resizedImage.uri);
          await MediaLibrary.createAlbumAsync("MyAppImages", asset, false);

          const base64Image = await FileSystem.readAsStringAsync(
            resizedImage.uri,
            {
              encoding: FileSystem.EncodingType.Base64,
            }
          );

          handleChange(
            currentImageType,
            `data:image/jpeg;base64,${base64Image}`
          );
        } catch (error) {
          console.error("Error processing the image:", error);
          Alert.alert("Error", "Failed to process the image.");
        }
      }
    }
  };

  const onLoanDateChange = async (event, selectedDate) => {
    setShowLoanDatePicker(false);
    if (selectedDate && !isLoanOlderThan10Days) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      handleChange("loan_date", formattedDate);

      if (loan?.tenure_month && !isNaN(Number(loan.tenure_month))) {
        try {
          const token = await AsyncStorage.getItem("token");
          const response = await fetch(
            "https://reiosglobal.com/srivarimob/api/calculate-loan-close-date",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                loan_date: formattedDate,
                tenure_month: Number(loan.tenure_month),
              }),
            }
          );
          const data = await response.json();
          if (data.loan_closed_date) {
            handleChange("loan_closed_date", data.loan_closed_date);
          }
        } catch (error) {
          console.error("Error fetching loan close date:", error);
        }
      }
    }
  };

  const onLoanClosedDateChange = (event, selectedDate) => {
    setShowLoanClosedDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      handleChange("loan_closed_date", formattedDate);
    }
  };

  const calculateLoan = async () => {
    if (isLoanOlderThan10Days) return;

    if (
      !loan?.loan_amount ||
      !loan?.tenure_month ||
      !loan?.interest_percentage
    ) {
      Alert.alert(
        "Error",
        "Please fill loan amount, tenure and interest percentage first"
      );
      return;
    }

    setCalculating(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        "https://reiosglobal.com/srivarimob/api/loan/calculate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            loan_amount: loan.loan_amount,
            tenure_month: loan.tenure_month,
            interest_percentage: loan.interest_percentage,
          }),
        }
      );
      const data = await response.json();
      if (data.interest_amount && data.total_amount && data.monthly_due) {
        setCalculationResult({
          interestAmount: Number(data.interest_amount),
          totalAmount: Number(data.total_amount),
          monthlyDue: Number(data.monthly_due),
        });
        handleChange("total_amount", data.total_amount.toString());
      }
    } catch (error) {
      console.error("Error calculating loan:", error);
      Alert.alert("Error", "Failed to calculate loan.");
    } finally {
      setCalculating(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        `https://reiosglobal.com/srivarimob/api/loans/${loan.loan_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(loan),
        }
      );
      if (response.ok) {
        Alert.alert("Success", "Loan updated successfully");
        router.replace("/ViewLoan");
      } else {
        const err = await response.json();
        Alert.alert("Error", err.message || "Failed to update");
      }
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleDelete = async () => {
    try {
      const role = await AsyncStorage.getItem("role");
      if (role !== "admin") {
        Alert.alert("Permission Denied", "Only admins can delete loans.");
        return;
      }
      Alert.alert(
        "Confirm Delete",
        `Are you sure you want to delete loan ID ${loan.loan_id}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              try {
                const token = await AsyncStorage.getItem("token");
                const response = await fetch(
                  `https://reiosglobal.com/srivarimob/api/loans/${loan.loan_id}`,
                  {
                    method: "DELETE",
                    headers: {
                      Accept: "application/json",
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                if (response.ok) {
                  Alert.alert("Success", "Loan deleted successfully.");
                  router.replace("/ViewLoan");
                } else {
                  const err = await response.json();
                  Alert.alert("Error", err.message || "Failed to delete");
                }
              } catch (error) {
                console.error("Delete error:", error);
                Alert.alert("Error", "Something went wrong");
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (err) {
      console.error("Permission check error:", err);
      Alert.alert("Error", "Failed to check permissions");
    }
  };

  if (!loan) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
        <Text style={styles.loadingText}>Loading loan data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Loan ID */}
          <Text style={styles.label}>Loan ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Loan ID"
            value={loan.loan_id}
            editable={false}
          />

          {/* Customer Name */}
          <Text style={styles.label}>Customer Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Customer Name"
            value={loan.customer_name}
            editable={false}
          />

          {/* Customer ID */}
          <Text style={styles.label}>Customer ID</Text>
          <TextInput
            style={styles.input}
            placeholder="User ID"
            value={loan.user_id}
            editable={false}
          />

          {/* Employee ID */}
          <Text style={styles.label}>Collected By (User ID)</Text>
          <TextInput
            style={styles.input}
            placeholder="Employee ID"
            value={loan.employee_id}
            editable={false}
          />

          {/* Vehicle Section */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsFieldsVisible(!isFieldsVisible)}
          >
            <Text style={styles.buttonText}>
              <Icon name="car" size={20} color="#fff" /> Vehicle Details
            </Text>
          </TouchableOpacity>

          {isFieldsVisible && (
            <View style={styles.addcontainer}>
              {/* Segment Picker */}
              <Text style={styles.label}>Segment</Text>
              <View
                style={[
                  styles.pickerContainer,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Picker
                  selectedValue={loan.segment}
                  style={[styles.inputPicker, { color: theme.colors.text }]}
                  dropdownIconColor={theme.colors.text}
                  onValueChange={(value) => handleChange("segment", value)}
                >
                  <Picker.Item label="Select Segment" value="" />
                  <Picker.Item label="Two Wheeler" value="Two Wheeler" />
                  <Picker.Item
                    label="Three Wheeler - Auto"
                    value="Three Wheeler - Auto"
                  />
                  <Picker.Item
                    label="Three Wheeler - Load Auto"
                    value="Three Wheeler - Load Auto"
                  />
                  <Picker.Item label="Four Wheeler" value="Four Wheeler" />
                  <Picker.Item
                    label="Commercial - Vehicle"
                    value="Commercial"
                  />
                  {/* <Picker.Item label="Commercial" value="Commercial" />  Add this option */}
                </Picker>
              </View>

              {/* Vehicle Make */}
              <Text style={styles.label}>Vehicle Make</Text>
              <TextInput
                style={styles.input}
                placeholder="Vehicle Make"
                value={loan.vehicle_make}
                onChangeText={(val) => handleChange("vehicle_make", val)}
              />

              {/* Vehicle Model */}
              {/* <Text style={styles.label}>Vehicle Model</Text>
              <TextInput
                style={styles.input}
                placeholder="Vehicle Model"
                value={loan.vehicle_model}
                onChangeText={(val) => handleChange("vehicle_model", val)}
              /> */}

              {/* Year of Manufacture */}
              <View
                style={[
                  styles.pickerContainer,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Picker
                  // selectedValue={Number(loan.year_of_manufacture) || ""}
                  selectedValue={
                    loan.year_of_manufacture !== undefined &&
                    loan.year_of_manufacture !== null &&
                    loan.year_of_manufacture !== ""
                      ? Number(loan.year_of_manufacture)
                      : ""
                  }
                  style={[styles.inputPicker, { color: theme.colors.text }]}
                  dropdownIconColor={theme.colors.text}
                  onValueChange={(value) =>
                    handleChange("year_of_manufacture", value)
                  }
                >
                  <Picker.Item label="Year of Manufacture" value="" />
                  {[...Array(30)].map((_, i) => {
                    const currentYear = new Date().getFullYear();
                    const year = currentYear - i;
                    return (
                      <Picker.Item label={`${year}`} value={year} key={year} />
                    );
                  })}
                </Picker>
              </View>

              {/* VIN Number */}
              <Text style={styles.label}>VIN Number</Text>
              <TextInput
                style={styles.input}
                placeholder="VIN"
                value={loan.VIN_number}
                onChangeText={(text) => {
                  let filteredText = text
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "");
                  if (filteredText.length > 17) {
                    filteredText = filteredText.substring(0, 17);
                    setVinError("VIN cannot exceed 17 characters");
                  } else {
                    setVinError("");
                  }
                  handleChange("VIN_number", filteredText);
                  if (text !== filteredText) {
                    setVinError(
                      "Only uppercase letters and numbers are allowed"
                    );
                  }
                }}
              />
              {vinError !== "" && (
                <Text style={styles.errorText}>{vinError}</Text>
              )}

              {/* Chassis Number */}
              <Text style={styles.label}>Chassis Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Chassis Number"
                value={loan.chassis_number}
                onChangeText={(val) => handleChange("chassis_number", val)}
              />

              {/* Engine Number */}
              {/* <Text style={styles.label}>Engine Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Engine Number"
                value={loan.engine_number}
                onChangeText={(val) => handleChange('engine_number', val)}
              /> */}

              {/* Vehicle Photos Grid */}
              <View style={{ flexDirection: "column" }}>
                {/* Row 1 */}
                <View style={styles.photoContainer}>
                  {/* Front Photo */}
                  <View style={styles.column}>
                    <TouchableOpacity
                      onPress={() => openModal("vehicle_exterior_photo_front")}
                      style={styles.filebutton}
                    >
                      <Text style={styles.filebuttonText}>Front Photo</Text>
                    </TouchableOpacity>
                    {loan.vehicle_exterior_photo_front ? (
                      <Avatar.Image
                        size={55}
                        source={{ uri: loan.vehicle_exterior_photo_front }}
                        style={styles.avatar}
                      />
                    ) : null}
                  </View>

                  {/* Back Photo */}
                  <View style={styles.column}>
                    <TouchableOpacity
                      onPress={() => openModal("vehicle_exterior_photo_back")}
                      style={styles.filebutton}
                    >
                      <Text style={styles.filebuttonText}>Back Photo</Text>
                    </TouchableOpacity>
                    {loan.vehicle_exterior_photo_back ? (
                      <Avatar.Image
                        size={55}
                        source={{ uri: loan.vehicle_exterior_photo_back }}
                        style={styles.avatar}
                      />
                    ) : null}
                  </View>
                </View>

                {/* Row 2 */}
                <View style={styles.photoContainer}>
                  {/* Left Photo */}
                  <View style={styles.column}>
                    <TouchableOpacity
                      onPress={() => openModal("vehicle_exterior_photo_left")}
                      style={styles.filebutton}
                    >
                      <Text style={styles.filebuttonText}>Left Photo</Text>
                    </TouchableOpacity>
                    {loan.vehicle_exterior_photo_left ? (
                      <Avatar.Image
                        size={55}
                        source={{ uri: loan.vehicle_exterior_photo_left }}
                        style={styles.avatar}
                      />
                    ) : null}
                  </View>

                  {/* Right Photo */}
                  <View style={styles.column}>
                    <TouchableOpacity
                      onPress={() => openModal("vehicle_exterior_photo_right")}
                      style={styles.filebutton}
                    >
                      <Text style={styles.filebuttonText}>Right Photo</Text>
                    </TouchableOpacity>
                    {loan.vehicle_exterior_photo_right ? (
                      <Avatar.Image
                        size={55}
                        source={{ uri: loan.vehicle_exterior_photo_right }}
                        style={styles.avatar}
                      />
                    ) : null}
                  </View>
                </View>

                {/* Row 3 */}
                <View style={styles.photoContainer}>
                  {/* Dashboard Photo */}
                  <View style={styles.column}>
                    <TouchableOpacity
                      onPress={() => openModal("odometer_reading_photo")}
                      style={styles.filebutton}
                    >
                      <Text style={styles.filebuttonText}>Dashboard</Text>
                    </TouchableOpacity>
                    {loan.odometer_reading_photo ? (
                      <Avatar.Image
                        size={55}
                        source={{ uri: loan.odometer_reading_photo }}
                        style={styles.avatar}
                      />
                    ) : null}
                  </View>

                  {/* Chassis Photo */}
                  <View style={styles.column}>
                    <TouchableOpacity
                      onPress={() => openModal("engine_number_photo")}
                      style={styles.filebutton}
                    >
                      <Text style={styles.filebuttonText}>Engine Photo</Text>
                    </TouchableOpacity>
                    {loan.engine_number_photo && (
                      <Avatar.Image
                        size={55}
                        source={{ uri: loan.engine_number_photo }}
                        style={styles.avatar}
                      />
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Loan Details */}
          <Text style={styles.label}>Loan Amount</Text>
          <TextInput
            style={[
              styles.input,
              isLoanOlderThan10Days && styles.disabledInput,
            ]}
            placeholder="Loan Amount"
            value={loan.loan_amount}
            keyboardType="numeric"
            onChangeText={(val) => handleChange("loan_amount", val)}
            editable={!isLoanOlderThan10Days}
          />

          <Text style={styles.label}>Interest %</Text>
          <TextInput
            style={[
              styles.input,
              isLoanOlderThan10Days && styles.disabledInput,
            ]}
            placeholder="Interest %"
            value={loan.interest_percentage}
            keyboardType="numeric"
            onChangeText={(val) => handleChange("interest_percentage", val)}
            editable={!isLoanOlderThan10Days}
          />

          <Text style={styles.label}>Tenure (Months)</Text>
          <TextInput
            style={[
              styles.input,
              isLoanOlderThan10Days && styles.disabledInput,
            ]}
            placeholder="Tenure (Months)"
            value={loan.tenure_month}
            keyboardType="numeric"
            onChangeText={(val) => handleChange("tenure_month", val)}
            editable={!isLoanOlderThan10Days}
          />

          {/* Calculate Button */}
          <TouchableOpacity
            onPress={calculateLoan}
            style={[
              styles.calculateButton,
              isLoanOlderThan10Days && styles.disabledButton,
            ]}
            disabled={isLoanOlderThan10Days}
          >
            <Text style={styles.buttonText}>Calculate Loan</Text>
          </TouchableOpacity>

          {calculating ? (
            <Text style={styles.loadingText}>Calculating...</Text>
          ) : (
            calculationResult.totalAmount > 0 && (
              <View style={styles.resultCard}>
                <Text style={styles.resultText}>
                  Interest Amount: ₹
                  {formatNumber(calculationResult.interestAmount)}
                </Text>
                <Text style={styles.resultText}>
                  Total Amount: ₹{formatNumber(calculationResult.totalAmount)}
                </Text>
                <Text style={styles.resultText}>
                  Monthly EMI: ₹{formatNumber(calculationResult.monthlyDue)}
                </Text>
              </View>
            )
          )}

          {/* Loan Date */}
          <Text style={styles.label}>Loan Date</Text>
          <View style={styles.dateInputContainer}>
            <TextInput
              style={[
                styles.input,
                styles.dateInput,
                isLoanOlderThan10Days && styles.disabledInput,
              ]}
              placeholder="Loan Date (DD-MM-YYYY)"
              value={formatDate(loan.loan_date)}
              onChangeText={(val) => handleChange("loan_date", val)}
              editable={!isLoanOlderThan10Days}
            />
            <TouchableOpacity
              style={[
                styles.calendarButton,
                isLoanOlderThan10Days && styles.disabledButton,
              ]}
              onPress={() =>
                !isLoanOlderThan10Days && setShowLoanDatePicker(true)
              }
              disabled={isLoanOlderThan10Days}
            >
              <Icon
                name="calendar"
                size={24}
                color={isLoanOlderThan10Days ? "#999" : "#FFC107"}
              />
            </TouchableOpacity>
          </View>
          {showLoanDatePicker && (
            <DateTimePicker
              value={loan.loan_date ? new Date(loan.loan_date) : new Date()}
              mode="date"
              display="default"
              onChange={onLoanDateChange}
            />
          )}

          {/* Loan Closed Date */}
          <Text style={styles.label}>Loan Closed Date</Text>
          <View style={styles.dateInputContainer}>
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="Loan Closed Date (YYYY-MM-DD)"
              value={formatDate(loan.loan_closed_date)}
              onChangeText={(val) => handleChange("loan_closed_date", val)}
            />
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setShowLoanClosedDatePicker(true)}
            >
              <Icon name="calendar" size={24} color="#FFC107" />
            </TouchableOpacity>
          </View>
          {showLoanClosedDatePicker && (
            <DateTimePicker
              value={
                loan.loan_closed_date
                  ? new Date(loan.loan_closed_date)
                  : new Date()
              }
              mode="date"
              display="default"
              onChange={onLoanClosedDateChange}
            />
          )}

          {/* Status Picker */}
          <Text style={styles.label}>Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={loan.status}
              style={styles.picker}
              onValueChange={(val) => handleChange("status", val)}
            >
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="In Progress" value="inprogress" />
              <Picker.Item label="Preclosed" value="preclose" />
              <Picker.Item label="Completed" value="completed" />
            </Picker>
          </View>

          {/* Transaction Proof */}
          <View style={styles.tphotoContainer}>
            {/* Transaction Proof Photo */}
            <View style={styles.tcolumn}>
              {loan.image ? (
                <Avatar.Image
                  size={90}
                  source={{ uri: loan.image }}
                  style={styles.tavatar}
                />
              ) : null}

              <TouchableOpacity
                onPress={() => openModal("image")}
                style={styles.tfilebutton}
              >
                <Text style={styles.tfilebuttonText}>Transaction Proof</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title="Update Loan"
              color="#FFC107"
              onPress={handleUpdate}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Delete Loan" color="red" onPress={handleDelete} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Image Picker Modal */}
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
            engine_number_photo: false,
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
              onPress={() => closeModal(currentImageType)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: "#07387A",
  },
  container: {
    padding: 20,
    paddingBottom: 180,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
    color: "#181515ff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#FFC107",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "#fff",
    color: "#000",
    marginBottom: 10,
  },
  disabledInput: {
    backgroundColor: "#e0e0e0",
    color: "#666",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#FFC107",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  buttonContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#fff",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dateInput: {
    flex: 1,
    marginRight: 10,
    borderColor: "#FFC107",
    backgroundColor: "#FFF8E1",
  },
  calendarButton: {
    backgroundColor: "#07387A",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  addButton: {
    backgroundColor: "#FFC107",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  calculateButton: {
    backgroundColor: "#FFC107",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  disabledButton: {
    backgroundColor: "#e0e0e0",
  },
  addcontainer: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 20,
  },
  photoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  column: {
    alignItems: "center",
    justifyContent: "center",
    width: 150, // 🔹 Fixed width for all cards
    height: 100, // 🔹 Fixed height for all cards
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5ebf1ff",
    padding: 10,
  },
  filebutton: {
    backgroundColor: "#07387A",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  filebuttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  avatar: {
    marginTop: 10,
  },

  resultCard: {
    backgroundColor: "#14274E",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  resultText: {
    color: "#fff",
    fontSize: 16,
    marginVertical: 5,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
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

  tphotoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  tcolumn: {
    alignItems: "center",
    justifyContent: "center",
    // width: 150,
    // height: 150,
    // backgroundColor: "#f2f2f2",
    // borderRadius: 10,
    // borderWidth:1 ,
    // borderColor:"#e5ebf1ff",
    padding: 10,
  },
  tfilebutton: {
    backgroundColor: "#fff",
    paddingHorizontal: 60,
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  tfilebuttonText: {
    color: "#07387A",
    fontSize: 16,
    fontWeight: "bold",
  },
  tavatar: {
    marginBottom: 10,
  },
});

export default EditLoan;


//  LOG  Loan data response: {"emi_details": {"interest_per_month": 25, "monthly_due": 525, "principal_per_month": 500, "total_amount": 2630, "total_interest": 125}, "loan": {"VIN_number": "TNTN0TN09", "VIN_plate_number_photo": null, "chassis_number": "62636", "created_at": "2025-09-19T10:21:34.000000Z", "due_amount": 525, "employee_id": "A001", "engine_number": null, "engine_number_photo": "12345/68cd2eae72ab1.jpeg", "id": 84, "image": null, "interest_percentage": 12, "loan_amount": 2500, "loan_category": "monthly", "loan_closed_date": "2026-01-31", "loan_date": "2025-09-27", "loan_id": "12345", "odometer_reading_photo": "12345/68cd2eae72912.jpeg", "segment": "Commercial", "status": "pending", "tenure_month": 5, "total_amount": 2630, "updated_at": "2025-09-19T10:21:34.000000Z", "user_id": "Test002", "user_name": "code success", "vehicle_exterior_photo_back": null, "vehicle_exterior_photo_front": null, "vehicle_exterior_photo_left": null, "vehicle_exterior_photo_right": null, "vehicle_make": "Tata", "vehicle_model": null, "vehicle_price": 0, "year_of_manufacture": "2018"}, "message": "Loan created successfully."}