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
} from "react-native";

import { TextInput, Button, Avatar, HelperText } from "react-native-paper";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons"; // For modal options
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library"; // Needed for image saving
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";

import api from "./Api";
import { useLocalSearchParams } from "expo-router";

const EditCustomer = () => {
  const navigation = useNavigation();
 const route = useRoute();
  const params = useLocalSearchParams();
  const { id } = params;

  console.log("edit page:", params)
  console.log("edit page:", id)

  const [modalVisible, setModalVisible] = useState(false);
  const [currentImageType, setCurrentImageType] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [showCityInput, setShowCityInput] = useState(false);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const router = useRouter();


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

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "Invalid customer ID");
      return;
    }

    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        console.log("Fetching customer data for ID:", id);
        const response = await api.get(`/profile/${id}`);
        const data = response.data.message;

        console.log("Customer data:", data);

        setFormData({
          user_id: data.user_id || "",
          user_name: data.user_name || "",
          aadhar_number: data.aadhar_number || "",
          nominee_photo: data.nominee_photo || "",
          nominee_sign: data.nominee_sign || "",
          address: data.address || "",
          landmark: data.landmark || "",
          city: data.city || "",
          pincode: data.pincode || "",
          qualification: data.qualification || "",
          designation: data.designation || "",
          district: data.district || "",
          user_type: data.user_type || "",
          status: data.status || "",
          mobile_number: data.mobile_number || "",
          alter_mobile_number: data.alter_mobile_number || "",
          email: data.email || "",
          profile_photo: data.profile_photo || "",
          sign_photo: data.sign_photo || "",
          ref_name: data.ref_name || "",
          ref_user_id: data.ref_user_id || "",
          ref_sign_photo: data.ref_sign_photo || "",
          ref_aadhar_number: data.ref_aadhar_number || "",
          password: "",
          confirmPassword: "",
          added_by: data.added_by || "",
        });

        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Fetch error:", error);
        Alert.alert("Error", "Failed to load customer data");
      }
    };

    fetchCustomerData();
  }, [id]);

  // Role & user id from storage
  useEffect(() => {
    const fetchRoleAndUserId = async () => {
      const storedRole = await AsyncStorage.getItem("role");
      const storedUserId = await AsyncStorage.getItem("userid");
      if (storedRole) setRole(storedRole);
      if (storedUserId) {
        setFormData((prev) => ({
          ...prev,
          ref_user_id: storedUserId,
          added_by: storedUserId,
        }));
      }
    };
    fetchRoleAndUserId();
  }, []);

  // Fetch cities
  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await api.get("/cities");
      setCities(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Error fetching cities:", err);
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

  const pickImage = async (source) => {
    setModalVisible(false);
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert("Permission Denied", `Permissions are required to access the ${source}`);
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1 });

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
          const base64Image = await FileSystem.readAsStringAsync(resizedImage.uri, { encoding: FileSystem.EncodingType.Base64 });
          setFormData((prev) => ({ ...prev, [currentImageType]: `data:image/jpeg;base64,${base64Image}` }));
        } catch (err) {
          console.error("Error processing image:", err);
          Alert.alert("Error", "Failed to process image");
        }
      }
    }
  };

  const handleCityChange = (value) => {
    if (value === "others") {
      setShowCityInput(true);
      setFormData((prev) => ({ ...prev, city: "" }));
    } else {
      const cityObj = cities.find((c) => c.city_name === value);
      setFormData((prev) => ({ ...prev, city: value, pincode: cityObj?.pincode || "" }));
      setShowCityInput(false);
    }
    setSelectedCity(value);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.user_name.trim()) errs.user_name = "Name is required";
    else if (!/^[a-zA-Z\s]+$/.test(formData.user_name)) errs.user_name = "Name must contain only letters";

    if (!formData.mobile_number) errs.mobile_number = "Mobile Number is required";
    else if (!/^\d{10}$/.test(formData.mobile_number)) errs.mobile_number = "Mobile Number must be 10 digits";

    if (formData.aadhar_number && !/^\d{12}$/.test(formData.aadhar_number)) errs.aadhar_number = "Aadhar Number must be 12 digits";

    if (formData.password && formData.password.length < 4) errs.password = "Password must be more than 4 characters";

    if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match";

    setErrors(errs);
    return Object.values(errs).every((e) => e === "");
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      Alert.alert("Mandatory Fields Missing!", "Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...formData };
      await api.put(`/employees/${id}`, payload);
      setLoading(false);
      setVisible(true);
      router.replace("/Customer");
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Failed to update");
    }
  };

  const handleDelete = (id) => {
    api
      .delete(`user/${id}`)
      .then((res) => {
        Alert.alert("Deleted", res.data.message || "Customer deleted successfully");

            // ✅ Go back to the customer page
            router.replace("/Customer");
      })
      .catch((e) => {
        Alert.alert("Error", e.response?.data?.message || "Error");
      });
  };

  // Animate success message
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      const timeout = setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => setVisible(false));
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#07387A" />
      {/* Header */}
      {/* You can add your header component here */}

      <ScrollView>
        <View style={styles.container}>
          {/* ID (read-only) */}
          <TextInput mode="outlined" label="Id*" value={formData.user_id} disabled style={styles.input} />

          {/* Name */}
          <TextInput
            mode="outlined"
            label="Name*"
            value={formData.user_name}
            onChangeText={(val) => handleInputChange("user_name", val)}
            style={styles.input}
          />
          {errors.user_name && <HelperText type="error">{errors.user_name}</HelperText>}

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
          {errors.mobile_number && <HelperText type="error">{errors.mobile_number}</HelperText>}

          {/* Address */}
          <TextInput
            mode="outlined"
            label="Address"
            value={formData.address}
            onChangeText={(val) => handleInputChange("address", val)}
            style={styles.input}
          />

          {/* Status */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.status}
              onValueChange={(val) => handleInputChange("status", val)}
              style={styles.inputPicker}
            >
              <Picker.Item label="Select Status" value="" />
              <Picker.Item label="Active" value="active" />
              <Picker.Item label="Inactive" value="inactive" />
            </Picker>
          </View>

          {/* User Type */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.user_type}
              onValueChange={(val) => handleInputChange("user_type", val)}
              style={styles.inputPicker}
            >
              <Picker.Item label="User Type" value="" />
              <Picker.Item label="Customer" value="user" />
              {role === "admin" && <Picker.Item label="Employee" value="employee" />}
            </Picker>
          </View>

          {/* Aadhar Number */}
          <TextInput
            mode="outlined"
            label="Aadhar Number"
            maxLength={12}
            keyboardType="numeric"
            value={formData.aadhar_number}
            onChangeText={(val) => handleInputChange("aadhar_number", val)}
            style={styles.input}
          />
          {errors.aadhar_number && <HelperText type="error">{errors.aadhar_number}</HelperText>}

          {/* Qualification */}
          <TextInput
            mode="outlined"
            label="Qualification"
            value={formData.qualification}
            onChangeText={(val) => handleInputChange("qualification", val)}
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
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.city}
              onValueChange={(val) => handleCityChange(val)}
              style={styles.inputPicker}
            >
              <Picker.Item label="Select a city*" value="" />
              {cities.map((city, index) => (
                <Picker.Item key={index} label={city.city_name} value={city.city_name} />
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
            />
          )}

          {errors.city && <HelperText type="error">{errors.city}</HelperText>}

          {/* Pincode */}
          <TextInput
            mode="outlined"
            label="Pincode*"
            maxLength={6}
            keyboardType="phone-pad"
            value={formData.pincode}
            onChangeText={(val) => handleInputChange("pincode", val)}
            style={styles.input}
          />
          {errors.pincode && <HelperText type="error">{errors.pincode}</HelperText>}

          {/* District Picker */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.district}
              onValueChange={(val) => handleInputChange("district", val)}
              style={styles.inputPicker}
            >
              <Picker.Item label="Select District*" value="" />
              <Picker.Item label="Tirunelveli" value="tirunelveli" />
              <Picker.Item label="Tenkasi" value="tenkasi" />
              <Picker.Item label="Virudhunagar" value="virudhunagar" />
              <Picker.Item label="Others" value="others" />
            </Picker>
          </View>

          {/* District custom input if others */}
          {formData.district === "others" && (
            <TextInput
              mode="outlined"
              label="District"
              value={formData.district}
              onChangeText={(val) => handleInputChange("district", val)}
              style={styles.input}
            />
          )}
          {errors.district && <HelperText type="error">{errors.district}</HelperText>}

          {/* Email */}
          <TextInput
            mode="outlined"
            label="Email Address"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(val) => handleInputChange("email", val)}
            style={styles.input}
          />
          {errors.email && <HelperText type="error">{errors.email}</HelperText>}

          {/* Reference User ID */}
          <TextInput
            mode="outlined"
            label="Reference User ID"
            value={formData.ref_user_id}
            onChangeText={(val) => handleInputChange("ref_user_id", val)}
            style={styles.input}
          />
          {errors.ref_user_id && <HelperText type="error">{errors.ref_user_id}</HelperText>}

          {/* Nominee Name */}
          <TextInput
            mode="outlined"
            label="Nominee Name"
            value={formData.ref_name}
            onChangeText={(val) => handleInputChange("ref_name", val)}
            style={styles.input}
          />
          {errors.ref_name && <HelperText type="error">{errors.ref_name}</HelperText>}

          {/* Nominee Aadhar Number */}
          <TextInput
            mode="outlined"
            label="Nominee Aadhar Number"
            maxLength={12}
            keyboardType="phone-pad"
            value={formData.ref_aadhar_number}
            onChangeText={(val) => handleInputChange("ref_aadhar_number", val)}
            style={styles.input}
          />
          {errors.ref_aadhar_number && <HelperText type="error">{errors.ref_aadhar_number}</HelperText>}

          {/* Nominee Mobile No */}
          <TextInput
            mode="outlined"
            label="Nominee Mobile No"
            maxLength={10}
            keyboardType="phone-pad"
            value={formData.alter_mobile_number}
            onChangeText={(val) => handleInputChange("alter_mobile_number", val)}
            style={styles.input}
          />
          {errors.alter_mobile_number && <HelperText type="error">{errors.alter_mobile_number}</HelperText>}

          {/* Password */}
          <TextInput
            mode="outlined"
            label="Password"
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(val) => handleInputChange("password", val)}
            style={styles.input}
            right={
              <TextInput.Icon icon={showPassword ? "eye" : "eye-off"} onPress={() => setShowPassword(!showPassword)} />
            }
          />
          {errors.password && <HelperText type="error">{errors.password}</HelperText>}

          {/* Confirm Password */}
          <TextInput
            mode="outlined"
            label="Confirm Password"
            secureTextEntry={!showPassword}
            value={formData.confirmPassword}
            onChangeText={(val) => handleInputChange("confirmPassword", val)}
            style={styles.input}
          />
          {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword}</HelperText>}

          {/* Photo Uploads */}
          <View style={styles.photoContainer}>
            {/* Profile Photo */}
            <View style={styles.column}>
              {formData.profile_photo ? (
                <Avatar.Image size={80} source={{ uri: formData.profile_photo }} />
              ) : null}
              <Button
                onPress={() => {
                  setCurrentImageType("profile_photo");
                  setModalVisible(true);
                }}
                icon={() => <Icon name="camera" size={20} color="#0000FF" />}
                mode="contained"
                style={styles.photoButton}
                labelStyle={styles.photoButtonText}
              >
                Profile Photo
              </Button>
            </View>

            {/* Sign Photo */}
            <View style={styles.column}>
              {formData.sign_photo ? (
                <Avatar.Image size={80} source={{ uri: formData.sign_photo }} />
              ) : null}
              <Button
                onPress={() => {
                  setCurrentImageType("sign_photo");
                  setModalVisible(true);
                }}
                icon={() => <Icon name="camera" size={20} color="#0000FF" />}
                mode="contained"
                style={styles.photoButton}
                labelStyle={styles.photoButtonText}
              >
                Sign Photo
              </Button>
            </View>
          </View>

          {/* Modal for image selection */}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Choose an Option</Text>
                <TouchableOpacity style={styles.optionButton} onPress={() => pickImage("camera")}>
                  <Icon name="camera" size={20} color="#fff" />
                  <Text style={styles.optionText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionButton} onPress={() => pickImage("gallery")}>
                  <Icon name="image" size={20} color="#fff" />
                  <Text style={styles.optionText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Success message */}
          {visible && (
            <Animated.View style={[styles.popup, { opacity: fadeAnim }]}>
              <Text style={styles.popupText}>User Updated Successfully!</Text>
            </Animated.View>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              icon={() => <MaterialCommunityIcons name="pencil" size={20} color="#000" />}
              style={styles.submitbutton}
              onPress={handleUpdate}
            >
              <Text style={styles.submitbuttontext}>Update</Text>
            </Button>
            {/* Optional delete */}
             <Button
      icon={() => (
        <MaterialCommunityIcons name="delete-forever" size={20} color="#0000FF" />
      )}
      mode="contained"
      style={styles.deleteButton}
      onPress={() => handleDelete(id)}
    >
      Delete
    </Button>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default EditCustomer;

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#07387A",
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
    marginVertical: 20,
  },
  photoButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 7,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    width: "90%",
  },
  photoButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
  column: {
    alignItems: "center",
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
    top: 50,
    alignSelf: "center",
    backgroundColor: "#4BB543",
    padding: 15,
    borderRadius: 8,
    zIndex: 999,
  },
  popupText: {
    color: "#fff",
    fontSize: 16,
  },
  submitbutton: {
    backgroundColor: "#FFC107",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
  },
  submitbuttontext: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    alignSelf: "center",
  },
  deleteButton: {
    borderColor: "#f00",
    borderWidth: 1,
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
});