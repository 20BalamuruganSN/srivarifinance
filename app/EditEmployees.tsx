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
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useColorScheme } from "react-native";
import { DefaultTheme, DarkTheme } from "@react-navigation/native";
import { TextInput, Button, Avatar, HelperText } from "react-native-paper";
import {
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigationContainerRef, useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import api from "./Api";
import { useLocalSearchParams } from "expo-router";

const EditEmployee = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = useLocalSearchParams();
  const { id } = params;

  console.log("edit page:", params);
  console.log("edit page:", id);

  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  const [modalVisible, setModalVisible] = useState(false);
  const [currentImageType, setCurrentImageType] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [showCustomCity, setShowCustomCity] = useState(false);
  const [showCustomDistrict, setShowCustomDistrict] = useState(false);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([
    { id: 1, name: "Tirunelveli" },
    { id: 2, name: "Tenkasi" },
    { id: 3, name: "Virudhunagar" },
    { id: 4, name: "Others" },
  ]);
  const router = useRouter();

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
    address: "",
    landmark: "",
    city: "",
    pincode: "",
    qualification: "",
    designation: "",
    district: "",
    user_type: "employee",
    status: "",
    mobile_number: "",
    alter_mobile_number: "",
    email: "",
    profile_photo: "",
    sign_photo: "",
    ref_name: "",
    ref_user_id: "",
    ref_aadhar_number: "",
    password: "",
    confirmPassword: "",
    added_by: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "Invalid employee ID");
      return;
    }

    const fetchEmployeeData = async () => {
      setLoading(true);
      try {
        console.log("Fetching employee data for ID:", id);
        const response = await api.get(`/profile/${id}`);
        const data = response.data.message;

        console.log("Employee data:", data);

        setFormData({
          user_id: data.user_id || "",
          user_name: data.user_name || "",
          aadhar_number: data.aadhar_number || "",
          address: data.address || "",
          landmark: data.landmark || "",
          city: data.city || "",
          pincode: data.pincode || "",
          qualification: data.qualification || "",
          designation: data.designation || "",
          district: data.district || "",
          user_type: data.user_type || "employee",
          status: data.status || "",
          mobile_number: data.mobile_number || "",
          alter_mobile_number: data.alter_mobile_number || "",
          email: data.email || "",
          profile_photo: data.profile_photo || "",
          sign_photo: data.sign_photo || "",
          ref_name: data.ref_name || "",
          ref_user_id: data.ref_user_id || "",
          ref_aadhar_number: data.ref_aadhar_number || "",
          password: "",
          confirmPassword: "",
          added_by: data.added_by || "",
        });

        // After setting form data, check if city exists in predefined list
        if (data.city) {
          const cityExists = cities.some((c) => c.city_name === data.city);
          setShowCustomCity(!cityExists);
        }

        // Check if district exists in predefined list
        if (
          data.district &&
          !districts.some(
            (d) => d.name.toLowerCase() === data.district.toLowerCase()
          )
        ) {
          setShowCustomDistrict(true);
        }

        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Fetch error:", error);
        Alert.alert("Error", "Failed to load employee data");
      }
    };

    fetchEmployeeData();
  }, [id, cities]); // Added cities to dependency array

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
      Alert.alert(
        "Permission Denied",
        `Permissions are required to access the ${source}`
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
          const base64Image = await FileSystem.readAsStringAsync(
            resizedImage.uri,
            { encoding: FileSystem.EncodingType.Base64 }
          );
          setFormData((prev) => ({
            ...prev,
            [currentImageType]: `data:image/jpeg;base64,${base64Image}`,
          }));
        } catch (err) {
          console.error("Error processing image:", err);
          Alert.alert("Error", "Failed to process image");
        }
      }
    }
  };

  const handleCityChange = (value) => {
    if (value === "others") {
      setShowCustomCity(true);
      setFormData((prev) => ({ ...prev, city: "", pincode: "" }));
    } else {
      setShowCustomCity(false);
      const selectedCityObj = cities.find((c) => c.city_name === value);
      setFormData((prev) => ({
        ...prev,
        city: value,
        pincode: selectedCityObj?.pincode || "",
      }));
    }
  };

  const handleDistrictChange = (value) => {
    if (value === "Others") {
      setShowCustomDistrict(true);
      setFormData((prev) => ({ ...prev, district: "" }));
    } else {
      setShowCustomDistrict(false);
      setFormData((prev) => ({ ...prev, district: value.toLowerCase() }));
    }
  };

  const validateForm = () => {
    const errs = {};

    if (!formData.user_name.trim()) {
      errs.user_name = "Name is required";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.user_name)) {
      errs.user_name = "Name must contain only letters";
    }

    if (!formData.mobile_number) {
      errs.mobile_number = "Mobile Number is required";
    } else if (!/^\d+$/.test(formData.mobile_number)) {
      errs.mobile_number = "Mobile Number must contain only digits";
    } else if (formData.mobile_number.length !== 10) {
      errs.mobile_number = "Mobile Number must be 10 digits";
    }

    if (formData.aadhar_number && !/^\d{12}$/.test(formData.aadhar_number)) {
      errs.aadhar_number = "Aadhar Number must be 12 digits";
    }

    if (!formData.city) {
      errs.city = "City is required";
    }

    if (!formData.pincode) {
      errs.pincode = "Pincode is required";
    } else if (!/^\d+$/.test(formData.pincode)) {
      errs.pincode = "Pincode must contain only digits";
    } else if (formData.pincode.length !== 6) {
      errs.pincode = "Pincode must be 6 digits";
    }

    if (!formData.district) {
      errs.district = "District is required";
    }

    if (formData.password && formData.password.length < 4) {
      errs.password = "Password must be more than 4 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Mandatory Fields Missing!",
        "Please fill all required fields"
      );
      return;
    }

    setLoading(true);

    try {
      const payload = { ...formData };
      await api.put(`/employees/${id}`, payload);

      setLoading(false);
      setVisible(true);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            router.replace("/Employees");
          });
        }, 1500);
      });
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Failed to update employee");
    }
  };

  const handleDelete = async (id) => {
    try {
      const role = await AsyncStorage.getItem("role");

      if (role !== "admin") {
        Alert.alert("Permission Denied", "Only admins can delete employees.");
        return;
      }

      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this employee?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Yes",
            onPress: () => {
              api
                .delete(`user/${id}`)
                .then((res) => {
                  Alert.alert(
                    "Deleted",
                    res.data.message || "Employee deleted successfully"
                  );
                  router.replace("/Employees");
                })
                .catch((e) => {
                  Alert.alert("Error", e.response?.data?.message || "Error");
                });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      Alert.alert("Error", "Something went wrong while checking user role.");
      console.error("Delete role check failed:", error);
    }
  };

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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 180 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              {loading && (
                <View style={styles.overlay}>
                  <ActivityIndicator color="white" size="large" />
                </View>
              )}

              <TextInput
                mode="outlined"
                label="Id*"
                value={formData.user_id}
                disabled
                style={styles.input}
              />

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

              <TextInput
                mode="outlined"
                label="Address"
                value={formData.address}
                onChangeText={(val) => handleInputChange("address", val)}
                style={styles.input}
              />

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
                  <Picker.Item label="Select Status" value="" />
                  <Picker.Item label="Active" value="active" />
                  <Picker.Item label="Inactive" value="inactive" />
                </Picker>
              </View>

              <View
                style={[
                  styles.pickerContainer,
                  {
                    backgroundColor:
                      colorScheme === "dark"
                        ? theme.colors.background
                        : "#f5f5f5",
                  },
                ]}
              >
                <Picker
                  selectedValue={formData.user_type}
                  onValueChange={(val) => handleInputChange("user_type", val)}
                  style={[
                    styles.inputPicker,
                    {
                      color: theme.colors.text,
                      backgroundColor:
                        colorScheme === "dark"
                          ? theme.colors.background
                          : "#f5f5f5",
                    },
                  ]}
                  dropdownIconColor={theme.colors.text}
                >
                  <Picker.Item label="User Type" value="" />
                  <Picker.Item label="Customer" value="user" />
                  {role === "admin" && (
                    <Picker.Item label="Employee" value="employee" />
                  )}
                </Picker>
              </View>

              <TextInput
                mode="outlined"
                label="Aadhar Number"
                maxLength={12}
                keyboardType="numeric"
                value={formData.aadhar_number}
                onChangeText={(val) => handleInputChange("aadhar_number", val)}
                style={styles.input}
              />
              {errors.aadhar_number && (
                <HelperText type="error">{errors.aadhar_number}</HelperText>
              )}

              <TextInput
                mode="outlined"
                label="Qualification"
                value={formData.qualification}
                onChangeText={(val) => handleInputChange("qualification", val)}
                style={styles.input}
              />

              <TextInput
                mode="outlined"
                label="Designation"
                value={formData.designation}
                onChangeText={(val) => handleInputChange("designation", val)}
                style={styles.input}
              />

              <TextInput
                mode="outlined"
                label="Landmark"
                value={formData.landmark}
                onChangeText={(val) => handleInputChange("landmark", val)}
                style={styles.input}
              />

              <View
                style={[
                  styles.pickerContainer,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Picker
                  selectedValue={formData.city || ""}
                  onValueChange={(val) => handleCityChange(val)}
                  style={[styles.inputPicker, { color: theme.colors.text }]}
                  dropdownIconColor={theme.colors.text}
                >
                  <Picker.Item label="Select a city*" value="" />
                  {cities.map((city, index) => (
                    <Picker.Item
                      key={index}
                      label={city.city_name}
                      value={city.city_name}
                    />
                  ))}
                  <Picker.Item label="Others" value="others" />
                </Picker>
              </View>
              {errors.city && (
                <HelperText type="error">{errors.city}</HelperText>
              )}

              {showCustomCity && (
                <>
                  <TextInput
                    mode="outlined"
                    label="Enter City Name*"
                    value={formData.city}
                    onChangeText={(val) => handleInputChange("city", val)}
                    style={styles.input}
                    theme={
                      colorScheme === "dark"
                        ? { colors: { text: "white", placeholder: "gray" } }
                        : undefined
                    }
                  />
                  <TextInput
                    mode="outlined"
                    label="Enter Pincode*"
                    maxLength={6}
                    keyboardType="phone-pad"
                    value={formData.pincode}
                    onChangeText={(val) => handleInputChange("pincode", val)}
                    style={styles.input}
                  />
                  {errors.pincode && (
                    <HelperText type="error">{errors.pincode}</HelperText>
                  )}
                </>
              )}

              {!showCustomCity && formData.city && (
                <TextInput
                  mode="outlined"
                  label="Pincode*"
                  maxLength={6}
                  keyboardType="phone-pad"
                  value={formData.pincode}
                  onChangeText={(val) => handleInputChange("pincode", val)}
                  style={styles.input}
                  editable={!!cities.find((c) => c.city_name === formData.city)}
                />
              )}

              <TextInput
                mode="outlined"
                label="Enter District Name*"
                value={formData.district}
                onChangeText={(val) => handleInputChange("district", val)}
                style={styles.input}
              />

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

              {/* <TextInput
                mode="outlined"
                label="Nominee User ID"
                value={formData.ref_user_id}
                onChangeText={(val) => handleInputChange("ref_user_id", val)}
                style={styles.input}
              />
              {errors.ref_user_id && (
                <HelperText type="error">{errors.ref_user_id}</HelperText>
              )} */}

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

                  <TextInput
                mode="outlined"
                label="Nominee Aadhar Number"
                maxLength={12}
                value={formData.ref_aadhar_number}
                onChangeText={(val) => handleInputChange("ref_aadhar_number", val)}
                style={styles.input}
              />
              {errors.ref_aadhar_number && (
                <HelperText type="error">{errors.ref_aadhar_number}</HelperText>
              )}

                  <TextInput
                mode="outlined"
                label="Nominee Mobile Number"
                maxLength={10}
                value={formData.alter_mobile_number}
                onChangeText={(val) => handleInputChange("alter_mobile_number", val)}
                style={styles.input}
              />
              {errors.alter_mobile_number && (
                <HelperText type="error">{errors.alter_mobile_number}</HelperText>
              )}

              <View style={styles.photoContainer}>
                <View style={styles.column}>
                  {formData.profile_photo ? (
                    <Avatar.Image
                      size={80}
                      source={{ uri: formData.profile_photo }}
                    />
                  ) : null}
                  <Button
                    onPress={() => {
                      setCurrentImageType("profile_photo");
                      setModalVisible(true);
                    }}
                    icon={() => (
                      <Icon name="camera" size={20} color="#0000FF" />
                    )}
                    mode="contained"
                    style={styles.photoButton}
                    labelStyle={styles.photoButtonText}
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
                    onPress={() => {
                      setCurrentImageType("sign_photo");
                      setModalVisible(true);
                    }}
                    icon={() => (
                      <Icon name="camera" size={20} color="#0000FF" />
                    )}
                    mode="contained"
                    style={styles.photoButton}
                    labelStyle={styles.photoButtonText}
                  >
                    Sign Photo
                  </Button>
                </View>
              </View>

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

              {visible && (
                <Animated.View style={[styles.popup, { opacity: fadeAnim }]}>
                  <Text style={styles.popupText}>
                    Employee Updated Successfully!
                  </Text>
                </Animated.View>
              )}

              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  icon={() => (
                    <MaterialCommunityIcons
                      name="pencil"
                      size={20}
                      color="#000"
                    />
                  )}
                  style={styles.submitbutton}
                  onPress={handleUpdate}
                >
                  <Text style={styles.submitbuttontext}>Update</Text>
                </Button>

                {role === "admin" && (
                  <Button
                    icon={() => (
                      <MaterialCommunityIcons
                        name="delete-forever"
                        size={20}
                        color="#0000FF"
                      />
                    )}
                    mode="contained"
                    style={styles.deleteButton}
                    onPress={() => handleDelete(id)}
                  >
                    Delete
                  </Button>
                )}
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
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
  },
  submitbuttontext: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    alignSelf: "center",
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
});

export default EditEmployee;
