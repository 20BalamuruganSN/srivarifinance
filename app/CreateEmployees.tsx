import React, { useState, useEffect, useCallback, useRef } from "react";
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TextInput, Button, Avatar, HelperText } from "react-native-paper"; // Correct import from react-native-paper
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { UIActivityIndicator } from "react-native-indicators";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as MediaLibrary from 'expo-media-library';
import api from "./Api";
import { router } from "expo-router";

const CreateEmployees = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentImageType, setCurrentImageType] = useState("");
  const [EmployeeId, setEmployeeId] = useState("");
//   const router=useRouter();

  // State for form data & errors
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
    user_type: "", // Added user_type
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
    added_by: ""
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
    user_type: "", // added for validation
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
    added_by: ""
  });

  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [show, setShow] = useState(false);
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cityOptions, setCityOptions] = useState([]);

  // Fetch last Employee ID on mount
  useEffect(() => {
    const fetchNextEmployeeId = async () => {
      try {
        const response = await api.get('/getLastEmployeeUserId');
        if (response.data && response.data.next_user_id) {
          const newId = response.data.next_user_id;
          setEmployeeId(newId);
          setFormData(prev => ({ ...prev, user_id: newId }));
        }
      } catch (error) {
        console.error('Error fetching employee ID:', error);
      }
    };
    fetchNextEmployeeId();
  }, []);

  // Fetch Cities
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

  // Handle input changes
  const handleInputChange = (name, value) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === "mobile_number") {
        const prefix = value.substring(0, 4); // Changed to 4 to match password prefix logic
        newData.password = prefix;
        newData.confirmPassword = prefix;
      }
      return newData;
    });
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Validate form before submit
  const validateForm = () => {
    const errs = {};
    if (!formData.user_name.trim()) {
      errs.user_name = "Name is required";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.user_name)) {
      errs.user_name = "Name must contain only letters";
    }
    if (!formData.mobile_number.trim()) {
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
      Alert.alert("Validation Error", "Passwords do not match.");
      return false;
    }

    // Validate user_type
    if (!formData.user_type) {
      errs.user_type = "User type is required";
    }
    setErrors(errs);
    return !Object.values(errs).some(Boolean);
  };

  // Handle form submit
 const handleSubmit = async () => {
  if (!validateForm()) {
    Alert.alert("Mandatory Fields Missing!", "Please fill in the required fields.");
    return;
  }

  setLoading(true);

  try {
    // First: Register user
    const response = await api.post("/register", formData, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("✅ Registration Success:", response.data);

    setVisible(true);
    setLoading(false);

    // Navigate after successful registration
    router.replace("/Employees");

    // Optional: Add new city if flag is true
    if (show) {
      try {
        const cityResponse = await api.post("/add-cities", {
          city_name: formData.city,
          pincode: formData.pincode,
        });
        console.log("🏙️ City added:", cityResponse.data);
        setShow(false);
      } catch (err) {
        console.error("❌ Error adding city:", err);
      }
    }

  } catch (error: any) {
    setLoading(false);
    console.error("❌ Registration Error:", error);

    let msg = "An unexpected error occurred.";

    if (error.response) {
      // Server responded with error
      if (error.response.data.errors) {
        const errs = error.response.data.errors;
        msg = Object.entries(errs)
          .map(([key, messages]) => `${key}: ${(messages as string[]).join(", ")}`)
          .join("\n");
      } else if (error.response.data.message) {
        msg = error.response.data.message;
      }
    } else {
      msg = error.message || msg;
    }

    Alert.alert("Error", msg);
  }
};


  // Image picker
  const pickImage = async (source) => {
    setModalVisible(false);
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert("Permission Denied", `Permissions are required to access the ${source}.`);
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1 });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      if (Platform.OS === "web") {
        setFormData(prev => ({ ...prev, [currentImageType]: imageUri }));
      } else {
        try {
          const resizedImage = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 800 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );
          const asset = await MediaLibrary.createAssetAsync(resizedImage.uri);
          await MediaLibrary.createAlbumAsync("MyAppImages", asset, false);
          const base64Image = await FileSystem.readAsStringAsync(resizedImage.uri, { encoding: FileSystem.EncodingType.Base64 });
          setFormData(prev => ({ ...prev, [currentImageType]: `data:image/jpeg;base64,${base64Image}` }));
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

  // Fetch role & ref user id
  useEffect(() => {
    const fetchRole = async () => {
      const roleVal = await AsyncStorage.getItem("role");
      if (roleVal) setRole(roleVal);
    };
    fetchRole();

    const fetchRefUserId = async () => {
      const refId = await AsyncStorage.getItem("userid");
      if (refId) {
        setFormData(prev => ({ ...prev, ref_user_id: refId }));
      }
    };
    fetchRole();
    fetchRefUserId();
  }, []);

  // Animate message
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      const timeout = setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => setVisible(false));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  return (
    <ScrollView>
      {loading && (
        <View style={styles.overlay}>
          <UIActivityIndicator color="white" />
        </View>
      )}
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#07387A" />
        <Text style={styles.text}>Add Employee</Text>

        {/* ID (non-editable) */}
        <TextInput
          mode="outlined"
          label="ID"
          value={formData.user_id}
          editable={false}
          style={styles.input}
        />
        {errors.user_id && <HelperText type="error">{errors.user_id}</HelperText>}

        {/* Name */}
        <TextInput
          mode="outlined"
          label="Name*"
          value={formData.user_name}
          onChangeText={(value) => handleInputChange("user_name", value)}
          style={styles.input}
        />
        {errors.user_name && <HelperText type="error">{errors.user_name}</HelperText>}

        {/* Aadhar */}
        <TextInput
          mode="outlined"
          label="Aadhar Number"
          maxLength={12}
          keyboardType="numeric"
          value={formData.aadhar_number}
          onChangeText={(value) => handleInputChange("aadhar_number", value)}
          style={styles.input}
        />

        {/* Qualification */}
        <TextInput
          mode="outlined"
          label="Qualification"
          value={formData.qualification}
          onChangeText={(value) => handleInputChange("qualification", value)}
          style={styles.input}
        />

        {/* Address */}
        <TextInput
          mode="outlined"
          label="Address"
          value={formData.address}
          onChangeText={(value) => handleInputChange("address", value)}
          style={styles.input}
        />

        {/* Designation */}
        <TextInput
          mode="outlined"
          label="Designation"
          value={formData.designation}
          onChangeText={(value) => handleInputChange("designation", value)}
          style={styles.input}
        />

        {/* Landmark */}
        <TextInput
          mode="outlined"
          label="Landmark"
          value={formData.landmark}
          onChangeText={(value) => handleInputChange("landmark", value)}
          style={styles.input}
        />

        {/* City Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.city}
            onValueChange={(value) => handleInputChange("city", value)}
            style={styles.inputPicker}
          >
            <Picker.Item label="Select a city*" value="" />
            {cityOptions.map((city, index) => (
              <Picker.Item key={index} label={city.city_name} value={city.city_name} />
            ))}
            <Picker.Item label="Others" value="others" />
          </Picker>
        </View>
        {formData.city === "others" && (
          <TextInput
            mode="outlined"
            label="City"
            value={formData.city}
            onChangeText={(value) => handleInputChange("city", value)}
            style={styles.input}
          />
        )}

        {/* Pincode */}
        <TextInput
          mode="outlined"
          label="Pincode"
          maxLength={6}
          keyboardType="numeric"
          value={formData.pincode}
          onChangeText={(value) => handleInputChange("pincode", value)}
          style={styles.input}
        />

        {/* District Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.district}
            onValueChange={(value) => handleInputChange("district", value)}
            style={styles.inputPicker}
          >
            <Picker.Item label="District*" value="" />
            <Picker.Item label="Tirunelveli" value="tirunelveli" />
            <Picker.Item label="Tenkasi" value="tenkasi" />
            <Picker.Item label="Virudhunagar" value="virudhunagar" />
            <Picker.Item label="Others" value="others" />
          </Picker>
        </View>
        {formData.district === "others" && (
          <TextInput
            mode="outlined"
            label="District"
            value={formData.district}
            onChangeText={(value) => handleInputChange("district", value)}
            style={styles.input}
          />
        )}

        {/* Status */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.status}
            onValueChange={(value) => handleInputChange("status", value)}
            style={styles.inputPicker}
          >
            <Picker.Item label="Status" value="" />
            <Picker.Item label="Active" value="active" />
            <Picker.Item label="Inactive" value="inactive" />
          </Picker>
        </View>

        {/* User Type Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.user_type}
            style={styles.inputPicker}
            onValueChange={(value) => handleInputChange("user_type", value)}
          >
            <Picker.Item label="User Type" value="" />
            <Picker.Item label="Customer" value="user" />
            {role === "admin" && (
              <Picker.Item label="Employee" value="employee" />
            )}
          </Picker>
        </View>
        {errors.user_type && <HelperText type="error">{errors.user_type}</HelperText>}

        {/* Mobile */}
        <TextInput
          mode="outlined"
          label="Mobile No*"
          maxLength={10}
          keyboardType="phone-pad"
          value={formData.mobile_number}
          onChangeText={(value) => handleInputChange("mobile_number", value)}
          style={styles.input}
        />
        {errors.mobile_number && <HelperText type="error">{errors.mobile_number}</HelperText>}

        {/* Email */}
        <TextInput
          mode="outlined"
          label="Email Address"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(value) => handleInputChange("email", value)}
          style={styles.input}
        />
        {errors.email && <HelperText type="error">{errors.email}</HelperText>}

        {/* Password */}
        <TextInput
          mode="outlined"
          label="Password*"
          secureTextEntry={!showPassword}
          value={formData.password}
          onChangeText={(value) => handleInputChange("password", value)}
          style={styles.input}
          right={
            <TextInput.Icon
              icon={showPassword ? "eye" : "eye-off"}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />
        {errors.password && <HelperText type="error">{errors.password}</HelperText>}

        {/* Confirm Password */}
        <TextInput
          mode="outlined"
          label="Confirm Password"
          secureTextEntry={!showPassword}
          value={formData.confirmPassword}
          onChangeText={(value) => handleInputChange("confirmPassword", value)}
          style={styles.input}
        />
        {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword}</HelperText>}

        {/* Photos */}
        <View style={styles.photoContainer}>
          {/* Profile Photo */}
          <View style={styles.column}>
            {formData.profile_photo ? (
              <Avatar.Image size={80} source={{ uri: formData.profile_photo }} />
            ) : null}
            <Button
              onPress={() => openModal("profile_photo")}
              mode="contained"
              style={styles.photoButton}
              labelStyle={styles.photoButtonText}
              icon={() => <Icon name="camera" size={20} color="#0000FF" />}
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
              onPress={() => openModal("sign_photo")}
              mode="contained"
              style={styles.photoButton}
              labelStyle={styles.photoButtonText}
              icon={() => <Icon name="camera" size={20} color="#0000FF" />}
            >
              Sign Photo
            </Button>
          </View>
        </View>

        {/* Modal for Image Choice */}
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
            <Text style={styles.popupText}>New User Created!</Text>
          </Animated.View>
        )}

        {/* Submit Button */}
        <Button
          icon={() => <MaterialCommunityIcons name="pencil" size={20} color="black" />}
          mode="contained"
          style={styles.submitbutton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitbuttontext}>Submit</Text>
        </Button>
      </View>
    </ScrollView>
  );
};

export default CreateEmployees;

const styles = StyleSheet.create({
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
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
    alignSelf: "center",
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
    elevation: 4,
  },
  submitbuttontext: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    alignSelf: "center",
  },
});