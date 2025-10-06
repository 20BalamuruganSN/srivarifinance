import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  Modal,
  Animated,
  Text,
  StatusBar,
  BackHandler,
} from "react-native";
import { useColorScheme } from "react-native";
import { DefaultTheme, DarkTheme } from "@react-navigation/native";
import {
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { TextInput, Button, Avatar, HelperText } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { UIActivityIndicator } from "react-native-indicators";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import { useFocusEffect } from "@react-navigation/native";
import * as MediaLibrary from "expo-media-library";
import api from "./Api";
import { router, useNavigationContainerRef } from "expo-router";

const CreateEmployees = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentImageType, setCurrentImageType] = useState("");
  const [EmployeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showCityInput, setShowCityInput] = useState(false);
  const [showDistrictInput, setShowDistrictInput] = useState(false);
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cityOptions, setCityOptions] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");

  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  const [canGoBack, setCanGoBack] = useState(false);

  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const backAction = () => {
      if (canGoBack) {
        router.back();
      } else {
        router.replace("/Employees");
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

  const [formData, setFormData] = useState({
    user_id: "",
    user_name: "",
    aadhar_number: "",
    nominee_photo: "",
    nominee_sign: "",
    address: "",
    landmark: "",
    city: "",
    pincode: "",
    qualification: "",
    designation: "",
    district: "",
    user_type: "",
    status: "",
    mobile_number: "",
    alter_mobile_number: "",
    email: "",
    profile_photo: "",
    sign_photo: "",
    ref_name: "",
    ref_user_id: "",
    ref_sign_photo: "",
    ref_aadhar_number: "",
    password: "",
    confirmPassword: "",
    added_by: "",
  });

  const [errors, setErrors] = useState({
    user_id: "",
    user_name: "",
    aadhar_number: "",
    nominee_photo: "",
    nominee_sign: "",
    address: "",
    landmark: "",
    city: "",
    pincode: "",
    qualification: "",
    designation: "",
    district: "",
    user_type: "",
    status: "",
    mobile_number: "",

    email: "",
    profile_photo: "",
    sign_photo: "",
    ref_name: "",
    ref_user_id: "",
    ref_sign_photo: "",
    ref_aadhar_number: "",
    password: "",
    confirmPassword: "",
    added_by: "",
    alter_mobile_number: "",
  });

  useEffect(() => {
    const fetchNextEmployeeId = async () => {
      try {
        const response = await api.get("/getLastEmployeeUserId");
        if (response.data && response.data.next_user_id) {
          const newId = response.data.next_user_id;
          setEmployeeId(newId);
          setFormData((prev) => ({ ...prev, user_id: newId }));
        }
      } catch (error) {
        console.error("Error fetching employee ID:", error);
      }
    };
    fetchNextEmployeeId();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await api.get("/cities");
      setCityOptions(response.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCities();
    }, [])
  );

  const handleInputChange = (name, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "mobile_number") {
        const prefix = value.substring(0, 4);
        newData.password = prefix;
        newData.confirmPassword = prefix;
      }
      return newData;
    });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errs: any = {};

    if (!formData.user_name?.trim()) {
      errs.user_name = "Name is required";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.user_name)) {
      errs.user_name = "Name must contain only letters";
    }

    if (!formData.mobile_number?.trim()) {
      errs.mobile_number = "Mobile Number is required";
    } else if (!/^\d{10}$/.test(formData.mobile_number)) {
      errs.mobile_number = "Mobile Number must be 10 digits";
    }

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      errs.pincode = "Pincode must be 6 digits";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Email is not valid";
    }

    if (formData.password && formData.password.length < 4) {
      errs.password = "Password must be more than 4 characters";
    }

    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      errs.confirmPassword = "Passwords do not match";
    }

    if (!formData.user_type) {
      errs.user_type = "User type is required";
    }

    if (!formData.city) {
      errs.city = "City is required";
    }

    if (!formData.district) {
      errs.district = "District is required";
    }

    setErrors(errs);

    if (errs.confirmPassword) {
      Alert.alert("Validation Error", errs.confirmPassword);
    }

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Mandatory Fields Missing!",
        "Please fill in the required fields."
      );
      return;
    }

    setLoading(true);

    try {
      // First add city if it's a new one
      if (showCityInput && formData.city) {
        try {
          await api.post("/add-cities", {
            city_name: formData.city,
            pincode: formData.pincode,
          });
          setShowCityInput(false);
        } catch (err) {
          console.error("Error adding city:", err);
          Alert.alert("Error", "Failed to add new city");
          setLoading(false);
          return;
        }
      }

      // Then register the employee
      const response = await api.post("/register", formData, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ Registration Success:", response.data);
      setVisible(true);

      // Navigate after short delay
      setTimeout(() => {
        router.replace("/Employees");
      }, 1500);
    } catch (error: any) {
      setLoading(false);
      console.error("❌ Registration Error:", error);

      let msg = "An unexpected error occurred.";
      if (error.response) {
        if (error.response.data.errors) {
          const errs = error.response.data.errors;
          msg = Object.entries(errs)
            .map(
              ([key, messages]) =>
                `${key}: ${(messages as string[]).join(", ")}`
            )
            .join("\n");
        } else if (error.response.data.message) {
          msg = error.response.data.message;
        }
      } else {
        msg = error.message || msg;
      }

      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (source) => {
    setModalVisible(false);
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
        setFormData((prev) => ({ ...prev, [currentImageType]: imageUri }));
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
          setFormData((prev) => ({
            ...prev,
            [currentImageType]: `data:image/jpeg;base64,${base64Image}`,
          }));
        } catch (err) {
          console.error("Image processing error:", err);
          Alert.alert("Error", "Failed to process image");
        }
      }
    }
  };

  const openModal = (type) => {
    setCurrentImageType(type);
    setModalVisible(true);
  };

  const handleCityChange = (value) => {
    if (value === "others") {
      setShowCityInput(true);
      setFormData((prev) => ({ ...prev, city: "" }));
    } else {
      setFormData((prev) => ({
        ...prev,
        city: value,
        pincode: cityOptions.find((c) => c.city_name === value)?.pincode || "",
      }));
      setShowCityInput(false);
    }
    setSelectedCity(value);
  };

  const handleDistrictChange = (value) => {
    if (value === "others") {
      setShowDistrictInput(true);
      setFormData((prev) => ({ ...prev, district: "" }));
    } else {
      setFormData((prev) => ({ ...prev, district: value }));
      setShowDistrictInput(false);
    }
  };

  useEffect(() => {
    const fetchRoleAndUserId = async () => {
      const roleVal = await AsyncStorage.getItem("role");
      const refId = await AsyncStorage.getItem("userid");
      if (roleVal) setRole(roleVal);
      if (refId) {
        setFormData((prev) => ({
          ...prev,
          ref_user_id: refId,
          added_by: refId,
        }));
      }
    };
    fetchRoleAndUserId();
  }, []);

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
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#07387A" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {loading && (
              <View style={styles.overlay}>
                <UIActivityIndicator color="white" />
              </View>
            )}

            <View style={styles.container}>
              {/* ID */}
              <TextInput
                mode="outlined"
                label="ID"
                value={formData.user_id}
                editable={false}
                style={styles.input}
              />

              {/* Name */}
              <TextInput
                mode="outlined"
                label="Name*"
                value={formData.user_name}
                onChangeText={(val) => handleInputChange("user_name", val)}
                style={styles.input}
              />
              {errors.user_name && (
                <HelperText type="error">{errors.user_name}</HelperText>
              )}

              {/* Aadhar */}
              <TextInput
                mode="outlined"
                label="Aadhar Number"
                maxLength={12}
                keyboardType="numeric"
                value={formData.aadhar_number}
                onChangeText={(val) => handleInputChange("aadhar_number", val)}
                style={styles.input}
              />

              {/* Qualification */}
              <TextInput
                mode="outlined"
                label="Qualification"
                value={formData.qualification}
                onChangeText={(val) => handleInputChange("qualification", val)}
                style={styles.input}
              />

              {/* Address */}
              <TextInput
                mode="outlined"
                label="Address"
                value={formData.address}
                onChangeText={(val) => handleInputChange("address", val)}
                style={styles.input}
              />

              {/* Designation */}
              <TextInput
                mode="outlined"
                label="Designation"
                value={formData.designation}
                onChangeText={(val) => handleInputChange("designation", val)}
                style={styles.input}
              />

              {/* Landmark */}
              <TextInput
                mode="outlined"
                label="Landmark"
                value={formData.landmark}
                onChangeText={(val) => handleInputChange("landmark", val)}
                style={styles.input}
              />

              {/* City Picker */}
              <View
                style={[
                  styles.pickerContainer,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Picker
                  selectedValue={selectedCity}
                  onValueChange={handleCityChange}
                  style={[styles.inputPicker, { color: theme.colors.text }]}
                  dropdownIconColor={theme.colors.text}
                >
                  <Picker.Item label="Select a city*" value="" />
                  {cityOptions.map((city, index) => (
                    <Picker.Item
                      key={index}
                      label={city.city_name}
                      value={city.city_name}
                    />
                  ))}
                  <Picker.Item label="Others" value="others" />
                </Picker>
              </View>

              {/* Custom City Input */}
              {showCityInput && (
                <TextInput
                  mode="outlined"
                  label="City*"
                  value={formData.city}
                  onChangeText={(val) => handleInputChange("city", val)}
                  style={styles.input}
                  theme={
                    colorScheme === "dark"
                      ? { colors: { text: "white", placeholder: "gray" } }
                      : undefined
                  }
                />
              )}
              {errors.city && (
                <HelperText type="error">{errors.city}</HelperText>
              )}

              {/* Pincode */}
              <TextInput
                mode="outlined"
                label="Pincode"
                maxLength={6}
                keyboardType="numeric"
                value={formData.pincode}
                onChangeText={(val) => handleInputChange("pincode", val)}
                style={styles.input}
              />
              {errors.pincode && (
                <HelperText type="error">{errors.pincode}</HelperText>
              )}

              {/* District Picker */}
              <View
                style={[
                  styles.pickerContainer,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Picker
                  selectedValue={formData.district}
                  onValueChange={handleDistrictChange}
                  style={[styles.inputPicker, { color: theme.colors.text }]}
                  dropdownIconColor={theme.colors.text}
                >
                  <Picker.Item label="District*" value="" />
                  <Picker.Item label="Tirunelveli" value="tirunelveli" />
                  <Picker.Item label="Tenkasi" value="tenkasi" />
                  <Picker.Item label="Virudhunagar" value="virudhunagar" />
                  <Picker.Item label="Others" value="others" />
                </Picker>
              </View>

              {/* Custom District Input */}
              {showDistrictInput && (
                <TextInput
                  mode="outlined"
                  label="District*"
                  value={formData.district}
                  onChangeText={(val) => handleInputChange("district", val)}
                  style={styles.input}
                  theme={
                    colorScheme === "dark"
                      ? { colors: { text: "white", placeholder: "gray" } }
                      : undefined
                  }
                />
              )}
              {errors.district && (
                <HelperText type="error">{errors.district}</HelperText>
              )}

              {/* Status */}
              <View
                style={[
                  styles.pickerContainer,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(val) => handleInputChange("status", val)}
                  style={[styles.inputPicker, { color: theme.colors.text }]}
                  dropdownIconColor={theme.colors.text}
                >
                  <Picker.Item label="Status" value="" />
                  <Picker.Item label="Active" value="active" />
                  <Picker.Item label="Inactive" value="inactive" />
                </Picker>
              </View>

              {/* User Type */}
              <View
                style={[
                  styles.pickerContainer,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Picker
                  selectedValue={formData.user_type}
                  onValueChange={(val) =>
                    handleInputChange("user_type", "employee")
                  }
                  style={[styles.inputPicker, { color: theme.colors.text }]}
                  dropdownIconColor={theme.colors.text}
                >
                  {/* <Picker.Item label="User Type" value="" /> */}
                  {/* <Picker.Item label="Customer" value="user" /> */}
                  {role === "admin" && (
                    <Picker.Item label="Employee" value="employee" />
                  )}
                </Picker>
              </View>
              {errors.user_type && (
                <HelperText type="error">{errors.user_type}</HelperText>
              )}

              {/* Mobile */}
              <TextInput
                mode="outlined"
                label="Mobile No*"
                maxLength={10}
                keyboardType="phone-pad"
                value={formData.mobile_number}
                onChangeText={(val) => handleInputChange("mobile_number", val)}
                style={styles.input}
              />
              {errors.mobile_number && (
                <HelperText type="error">{errors.mobile_number}</HelperText>
              )}

              {/* Email */}
              <TextInput
                mode="outlined"
                label="Email Address"
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(val) => handleInputChange("email", val)}
                style={styles.input}
              />
              {errors.email && (
                <HelperText type="error">{errors.email}</HelperText>
              )}

              {/* Nominee Name */}
              <TextInput
                mode="outlined"
                label="Nominee Name"
                value={formData.ref_name}
                onChangeText={(val) => handleInputChange("ref_name", val)}
                style={styles.input}
              />
              {errors.ref_name && (
                <HelperText type="error">{errors.ref_name}</HelperText>
              )}

              {/* Nominee Aadhar Number */}
              <TextInput
                mode="outlined"
                label="Nominee Aadhar Number"
                maxLength={12}
                keyboardType="phone-pad"
                value={formData.ref_aadhar_number}
                onChangeText={(val) =>
                  handleInputChange("ref_aadhar_number", val)
                }
                style={styles.input}
              />
              {errors.ref_aadhar_number && (
                <HelperText type="error">{errors.ref_aadhar_number}</HelperText>
              )}

              {/* Nominee Mobile No */}
              <TextInput
                mode="outlined"
                label="Nominee Mobile No"
                maxLength={10}
                keyboardType="phone-pad"
                value={formData.alter_mobile_number}
                onChangeText={(val) =>
                  handleInputChange("alter_mobile_number", val)
                }
                style={styles.input}
              />
              {errors.alter_mobile_number && (
                <HelperText type="error">
                  {errors.alter_mobile_number}
                </HelperText>
              )}

              {/* Password */}
              <TextInput
                mode="outlined"
                label="Password*"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(val) => handleInputChange("password", val)}
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye" : "eye-off"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              {errors.password && (
                <HelperText type="error">{errors.password}</HelperText>
              )}

              {/* Confirm Password */}
              <TextInput
                mode="outlined"
                label="Confirm Password"
                secureTextEntry={!showPassword}
                value={formData.confirmPassword}
                onChangeText={(val) =>
                  handleInputChange("confirmPassword", val)
                }
                style={styles.input}
              />
              {errors.confirmPassword && (
                <HelperText type="error">{errors.confirmPassword}</HelperText>
              )}

              {/* Photos */}
              <View style={styles.photoContainer}>
                <View style={styles.column}>
                  {formData.profile_photo ? (
                    <Avatar.Image
                      size={80}
                      source={{ uri: formData.profile_photo }}
                    />
                  ) : null}
                  <Button
                    onPress={() => openModal("profile_photo")}
                    mode="contained"
                    style={styles.photoButton}
                    labelStyle={styles.photoButtonText}
                    icon={() => (
                      <Icon name="camera" size={20} color="#0000FF" />
                    )}
                  >
                    Profile Photo
                  </Button>
                </View>
                <View style={styles.column}>
                  {formData.sign_photo ? (
                    <Avatar.Image
                      size={80}
                      source={{ uri: formData.sign_photo }}
                    />
                  ) : null}
                  <Button
                    onPress={() => openModal("sign_photo")}
                    mode="contained"
                    style={styles.photoButton}
                    labelStyle={styles.photoButtonText}
                    icon={() => (
                      <Icon name="camera" size={20} color="#0000FF" />
                    )}
                  >
                    Sign Photo
                  </Button>
                </View>
              </View>

              {/* Image Selection Modal */}
              <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Choose an Option</Text>
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => pickImage("camera")}
                    >
                      <Icon name="camera" size={20} color="#fff" />
                      <Text style={styles.optionText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => pickImage("gallery")}
                    >
                      <Icon name="image" size={20} color="#fff" />
                      <Text style={styles.optionText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {/* Success Popup */}
              {visible && (
                <Animated.View style={[styles.popup, { opacity: fadeAnim }]}>
                  <Text style={styles.popupText}>New Employee Created!</Text>
                </Animated.View>
              )}

              {/* Submit Button */}
              <Button
                mode="contained"
                style={styles.submitbutton}
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                icon={() => (
                  <MaterialCommunityIcons
                    name="pencil"
                    size={20}
                    color="black"
                  />
                )}
              >
                <Text style={styles.submitbuttontext}>Submit</Text>
              </Button>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 180,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#07387A",
    marginBottom: 20,
    textAlign: "center",
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
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  inputPicker: {
    height: 50,
    width: "100%",
  },
  photoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },

  column: {
    alignItems: "center",
    justifyContent: "center",
    width: 150, // 🔹 same width
    height: 200, // 🔹 same height
    backgroundColor: "#f2f2f2", // optional bg
    borderRadius: 10,
    padding: 10,
  },

  photoButton: {
    backgroundColor: "#07387A",
    paddingHorizontal: 7,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    width: "100%", // 🔹 button full width of card
    marginTop: 10,
  },

  photoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 15,
    fontWeight: "bold",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#07387A",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    marginVertical: 8,
  },
  optionText: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
  },
  cancelText: {
    color: "#07387A",
    fontSize: 16,
  },
  popup: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#4BB543",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    zIndex: 999,
  },
  popupText: {
    color: "white",
    fontWeight: "bold",
  },
  submitbutton: {
    backgroundColor: "#FFC107",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    elevation: 4,
  },
  submitbuttontext: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    alignSelf: "center",
  },
});

export default CreateEmployees;
