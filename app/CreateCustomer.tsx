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
import Icon from "react-native-vector-icons/MaterialIcons"; // For modal options
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import * as MediaLibrary from "expo-media-library";
import api from "./Api";
import { router, useRouter } from "expo-router";
import CustomDrawerContent from "./Owner_Dash";

const CreateCustomer = () => {
  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);
  const [currentImageType, setCurrentImageType] = useState("");
  const [userId, setUserId] = useState("");

  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [showCityInput, setShowCityInput] = useState(false);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const route = useRouter()

interface FormData {
  user_id: string;
  user_name: string;
  aadhar_number: string;
  nominee_photo: string;
  nominee_sign: string;
  address: string;
  landmark: string;
  city: string;
  pincode: string;
  qualification: string;
  designation: string;
  district: string;
  user_type: string;
  status: string;
  mobile_number: string;
  alter_mobile_number: string;
  email: string;
  profile_photo: string;
  sign_photo: string;
  ref_name: string;
  ref_user_id: string;
  ref_sign_photo: string;
  ref_aadhar_number: string;
  password: string;
  confirmPassword: string;
  added_by: string;
}

interface Errors {
  user_id: string;
  user_name: string;
  aadhar_number: string;
  nominee_photo: string;
  nominee_sign: string;
  address: string;
  landmark: string;
  city: string;
  pincode: string;
  qualification: string;
  designation: string;
  district: string;
  user_type: string;
  status: string;
  mobile_number: string;
  alter_mobile_number: string;
  email: string;
  profile_photo: string;
  sign_photo: string;
  ref_name: string;
  ref_user_id: string;
  ref_sign_photo: string;
  ref_aadhar_number: string;
  password: string;
  confirmPassword: string;
}


 const [formData, setFormData] = useState<FormData>({
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

const [errors, setErrors] = useState<Errors>({
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
});
  // Fetch last user ID on mount
  useEffect(() => {
    const fetchNextUserId = async () => {
      try {
        const response = await api.get("/getLastCustomerUserId");
        if (response.data && response.data.next_user_id) {
          setUserId(response.data.next_user_id);
          setFormData((prev) => ({ ...prev, user_id: response.data.next_user_id }));
        }
      } catch (error) {
        console.error("Error fetching user id:", error);
      }
    };
    fetchNextUserId();
  }, []);


  // Handle input changes
  const handleInputChange = (name, value) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === "mobile_number") {
        const prefix = value.substring(0, 5); // Changed to 4 to match password logic
        newData.password = prefix;
        newData.confirmPassword = prefix;
      }
      return newData;
    });
    setErrors(prev => ({ ...prev, [name]: "" }));
  };


  // Fetch role and user id from storage
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

  // Image picker handler
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
          Alert.alert("Image saved", "Your image has been saved to the gallery.");

          const base64Image = await FileSystem.readAsStringAsync(resizedImage.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          setFormData((prev) => ({
            ...prev,
            [currentImageType]: `data:image/jpeg;base64,${base64Image}`,
          }));
        } catch (err) {
          console.error("Error processing image:", err);
          Alert.alert("Error", "Failed to process the image.");
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
      setFormData((prev) => ({
        ...prev,
        city: value,
        pincode: cityObj?.pincode || "",
      }));
      setShowCityInput(false);
    }
    setSelectedCity(value);
  };

  const validateForm = () => {
    const errs = {};

    if (!formData.user_name.trim()) errs.user_name = "Name is required";
    else if (!/^[a-zA-Z\s]+$/.test(formData.user_name))
      errs.user_name = "Name must contain only letters";

    if (!formData.mobile_number) errs.mobile_number = "Mobile Number is required";
    else if (!/^\d{10}$/.test(formData.mobile_number))
      errs.mobile_number = "Mobile Number must be 10 digits";

    if (formData.aadhar_number && !/^\d{12}$/.test(formData.aadhar_number))
      errs.aadhar_number = "Aadhar Number must be 12 digits";

    if (formData.password && formData.password.length < 4)
      errs.password = "Password must be more than 4 characters";

    if (
      formData.password !== formData.confirmPassword
    )
      errs.confirmPassword = "Passwords do not match";

    // Additional validations can be added here

    setErrors(errs);
    return Object.values(errs).every((e) => e === "");
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Mandatory Fields Missing!", "Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/register", formData, {
        headers: { "Content-Type": "application/json" },
      });
      setLoading(false);
      // Show success message
      setVisible(true);
      // Navigate to ListOfCustomer page after short delay
      setTimeout(() => {
        setVisible(false);
        router.replace("Customer" as never);
      }, 1500);
    } catch (error) {
      setLoading(false);
      let message = "An unexpected error occurred.";
      if (error.response) {
        if (error.response.data.errors) {
          message = Object.entries(error.response.data.errors)
            .map(([key, msgs]) => (Array.isArray(msgs) ? msgs.join(", ") : msgs))
            .join("\n");
        } else if (error.response.data.message) {
          message = error.response.data.message;
        }
      } else {
        message = error.message;
      }
      Alert.alert("Error", message);
    }

    // If city is new, add it
    if (showCityInput) {
      try {
        await api.post("/add-cities", {
          city_name: formData.city,
          pincode: formData.pincode,
        });
        setShowCityInput(false);
      } catch (err) {
        console.error("Error adding city:", err);
      }
    }
  };

  // Animate success message
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
      {/*  Header */}
      {/* <View style={styles.headerContainer}>
       <Icon.Button
          name="chevron-left" 
          size={24}
          color="#fff"
          marginTop={30}
        
          backgroundColor="transparent"
  onPress={() => route.replace('/Customer')}
/>
        <Text style={styles.header}>Add Customer</Text>
      </View> */}

    <ScrollView>
   
      <View style={styles.container}>
       

        {/* ID (auto filled) */}
        <TextInput
          mode="outlined"
          label="Id*"
          value={formData.user_id}
          editable={false}
          style={styles.input}
        />

       
       {/* <TextInput
  mode="outlined"
  label="File No"
  value={formData.qualification}
  onChangeText={(text) => setFormData(prev => ({ ...prev, qualification: text }))}
  style={styles.input}
/>
       */}
        
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
            selectedValue={selectedCity}
            onValueChange={(val) => handleCityChange(val)}
            style={styles.inputPicker}
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
            value={formData.district === "others" ? "" : formData.district}
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
              onPress={() => { setCurrentImageType("profile_photo"); setModalVisible(true); }}
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
              onPress={() => { setCurrentImageType("sign_photo"); setModalVisible(true); }}
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

        {/* Success message */}
        {visible && (
          <Animated.View style={[styles.popup, { opacity: fadeAnim }]}>
            <Text style={styles.popupText}>New User Created!</Text>
          </Animated.View>
        )}

        {/* Submit Button */}
        <Button
          mode="contained"
          icon={() => <MaterialCommunityIcons name="pencil" size={20} color="#000" />}
          style={styles.submitbutton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitbuttontext}>Submit</Text>
        </Button>
      </View>
    </ScrollView>
    </>
  );
};

export default CreateCustomer;


const styles = StyleSheet.create({
 
   headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#14274E',
  },
  header: {
    marginTop:30,
    textAlign: "center",
  
    fontSize: 20,
    fontWeight: "bold",
    padding: 10,
   
    color: '#fff',
    marginLeft: 40,
  },
 
  container: {
  flex: 1,
  padding: 20,
  backgroundColor: '#07387A',
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
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  inputPicker: {
    height: 50,
    width: '100%',
  },
  photoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },

  photoButton: {
    backgroundColor: '#ffffff', 
    paddingHorizontal: 7,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    width: '90%',
  },
  photoButtonText: {

    color: '#000', 
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  column: {
 
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#07387A',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginVertical: 8,
  },
  optionText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
  },
  cancelText: {
    color: '#07387A',
    fontSize: 16,
  },
  popup: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: '#4BB543',
    padding: 15,
    borderRadius: 8,
    zIndex: 999,
  },
  popupText: {
    color: '#fff',
    fontSize: 16,
  },
  submitbutton: {
    backgroundColor: '#FFC107', // Yellow color
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    elevation: 4,
  },
  submitbuttontext: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
});

