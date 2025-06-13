import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { TextInput, Button, Avatar } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import api from "./Api"; // Your API handler
import * as FileSystem from "expo-file-system";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

const EditEmployees = () => {
  const route = useRoute();
  const { id } = route.params;
  const navigation = useNavigation();

  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [Role, setRole] = useState("");

  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);

  const [employeeData, setEmployeeData] = useState({
    id: "",
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
   
    status: "",
    mobile_number: "",
    alter_mobile_number: "",
    email: "",
    profile_photo: "",
    sign_photo: "",
    ref_name: "example",
    ref_user_id: "ex201",
    ref_aadhar_number: "8596741253",
  });

  const [formData, setFormData] = useState({
    user_id: "",
    user_name: "",
    aadhar_number: "",
    nominee_photo: "", // base64 for nominee photo (if used)
    nominee_sign: "", // base64 for nominee sign
    address: "",
    landmark: "",
    city: "",
    pincode: "",
    qualification: "",
    designation: "",
    district: "",
    status: "",
    mobile_number: "",
    alter_mobile_number: "",
    email: "",
    profile_photo: "", // base64 string
    sign_photo: "", // base64 string
    ref_name: "",
    ref_user_id: "",
    ref_sign_photo: "", // if needed
    ref_aadhar_number: "",
    password: "",
    confirmPassword: "",
    added_by: "",
  });

  const [errors, setErrors] = useState({
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

  const [modalVisible, setModalVisible] = useState(false);
  const [currentImageType, setCurrentImageType] = useState(""); // "profile_photo" or "sign_photo"

  // Load role from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem("role").then((role) => {
      if (role) setRole(role);
    });
  }, []);

  // Fetch employee profile
  useEffect(() => {
    setLoading(true);
    api
      .get(`/profile/${id}`)
      .then((res) => {
        const data = res.data.message;
        setEmployeeData(data);
        setFormData({ ...data });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Fetch cities list
  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await api.get("/cities");
      setCities(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCities();
    }, [])
  );

  // Animate popup
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
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [visible, fadeAnim]);

  // Handle input change
  const handleInputChange = (name, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Auto set password & confirmPassword based on mobile_number prefix
      if (name === "mobile_number" && value.length >= 5) {
        const prefix = value.substring(0, 5);
        newData.password = prefix;
        newData.confirmPassword = prefix;
      }

      // Clear error for the field
      setErrors((prev) => ({ ...prev, [name]: "" }));
      return newData;
    });
  };

  // Validate form (expand as needed)
  const validateForm = () => {
    let formErrors = { ...errors };
    // Example validation: check required fields
    if (!formData.user_name) formErrors.user_name = "Name is required";
    if (!formData.aadhar_number) formErrors.aadhar_number = "Aadhar is required";
    // ... add other validations as needed
    setErrors(formErrors);
    // Return true if no errors
    return Object.values(formErrors).every((err) => !err);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      // Prepare payload with images included
      const payload = { ...formData };

      // Ensure images are base64 strings; they already are
      // If images are not changed, you might want to keep existing ones
      // but here, we assume formData has updated images if any

      await api.put(`/employees/${id}`, payload);
      setLoading(false);
      setVisible(true);
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Failed to update");
    }
  };

  const handleDelete = (id) => {
    api
      .delete(`user/${id}`)
      .then((res) => {
        Alert.alert(res.data.message);
        navigation.goBack();
      })
      .catch((e) => {
        Alert.alert("Error", e.response?.data?.message || "Error");
      });
  };

  // Function to open modal for image selection
  const openModal = (type) => {
    setCurrentImageType(type);
    setModalVisible(true);
  };

  // pickImage function
  const pickImage = async (sourceType) => {
    setModalVisible(false);
    const permission =
      sourceType === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert("Permission Denied", "Permissions are required to access media");
      return;
    }

    const result =
      sourceType === "camera"
        ? await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1 });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      try {
        const resized = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        const base64 = await FileSystem.readAsStringAsync(resized.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });3
        const imageDataUrl = `data:image/jpeg;base64,${base64}`;

        // Save to formData
        setFormData((prev) => ({
          ...prev,
          [currentImageType]: imageDataUrl,
        }));
      } catch (e) {
        console.log(e);
        Alert.alert("Error", "Failed to process image");
      }
    }
  };

  return (
    <ScrollView>
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator color="white" size={40} />
        </View>
      )}

      
      
     <View style={styles.container}>
           <StatusBar barStyle="light-content" backgroundColor="#07387A" />
           <Text style={styles.text}>Edit Employee</Text>
      

        {/* Form Inputs */}
        <TextInput
          mode="outlined"
          label="Id"
          value={formData.user_id}
          onChangeText={(value) => handleInputChange("user_id", value)}
          style={styles.input}
        />

        <TextInput
          mode="outlined"
          label="Name"
          value={formData.user_name}
          onChangeText={(value) => handleInputChange("user_name", value)}
          style={styles.input}
          error={!!errors.user_name}
        />
        {errors.user_name && <Text style={styles.errorText}>{errors.user_name}</Text>}

        {/* Qualification */}
        <TextInput
          mode="outlined"
          label="Qualification"
          value={formData.qualification}
          onChangeText={(value) => handleInputChange("qualification", value)}
          style={styles.input}
          error={!!errors.qualification}
        />
        {errors.qualification && <Text style={styles.errorText}>{errors.qualification}</Text>}

        {/* Designation */}
        <TextInput
          mode="outlined"
          label="Designation"
          value={formData.designation}
          onChangeText={(value) => handleInputChange("designation", value)}
          style={styles.input}
          error={!!errors.designation}
        />
        {errors.designation && <Text style={styles.errorText}>{errors.designation}</Text>}

        {/* Aadhar Number */}
        <TextInput
          mode="outlined"
          label="Aadhar Number"
          value={formData.aadhar_number}
          onChangeText={(value) => handleInputChange("aadhar_number", value)}
          style={styles.input}
          keyboardType="numeric"
          maxLength={12}
          error={!!errors.aadhar_number}
        />
        {errors.aadhar_number && <Text style={styles.errorText}>{errors.aadhar_number}</Text>}

        {/* Address */}
        <TextInput
          mode="outlined"
          label="Address"
          value={formData.address}
          onChangeText={(value) => handleInputChange("address", value)}
          style={styles.input}
          error={!!errors.address}
        />
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

        {/* Landmark */}
        <TextInput
          mode="outlined"
          label="Landmark"
          value={formData.landmark}
          onChangeText={(value) => handleInputChange("landmark", value)}
          style={styles.input}
          error={!!errors.landmark}
        />
        {errors.landmark && <Text style={styles.errorText}>{errors.landmark}</Text>}

        {/* City */}
        <TextInput
          mode="outlined"
          label="City"
          value={formData.city}
          onChangeText={(value) => handleInputChange("city", value)}
          style={styles.input}
          error={!!errors.city}
        />
        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

        {/* Pincode */}
        <TextInput
          mode="outlined"
          label="Pincode"
          value={formData.pincode}
          onChangeText={(value) => handleInputChange("pincode", value)}
          style={styles.input}
          keyboardType="numeric"
          maxLength={6}
          error={!!errors.pincode}
        />
        {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}

        {/* District */}
        <TextInput
          mode="outlined"
          label="District"
          value={formData.district}
          onChangeText={(value) => handleInputChange("district", value)}
          style={styles.input}
          error={!!errors.district}
        />
        {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}

        {/* Status Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.status}
            style={styles.inputPicker}
            onValueChange={(itemValue) => handleInputChange("status", itemValue)}
          >
            <Picker.Item label="Select Status" value="" />
            <Picker.Item label="Active" value="active" />
            <Picker.Item label="Inactive" value="inactive" />
          </Picker>
        </View>
        {errors.status && <Text style={styles.errorText}>{errors.status}</Text>}

        {/* Mobile Number */}
        <TextInput
          mode="outlined"
          label="Mobile No"
          value={formData.mobile_number}
          onChangeText={(value) => handleInputChange("mobile_number", value)}
          style={styles.input}
          keyboardType="phone-pad"
          maxLength={10}
        />
        {errors.mobile_number && <Text style={styles.errorText}>{errors.mobile_number}</Text>}

        {/* Email */}
        <TextInput
          mode="outlined"
          label="Email Address"
          value={formData.email}
          onChangeText={(value) => handleInputChange("email", value)}
          style={styles.input}
          keyboardType="email-address"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        {/* Reference User Id */}
        <TextInput
          mode="outlined"
          label="Reference User Id"
          value={formData.ref_user_id}
          onChangeText={(value) => handleInputChange("ref_user_id", value)}
          style={styles.input}
          editable={Role === "admin"}
        />


          <View style={styles.photoContainer}>
          {/* Profile Photo */}
          <View style={styles.column}>
            {formData.profile_photo && (
              <Avatar.Image size={80} source={{ uri: formData.profile_photo }} />
            )}
            <Button
              onPress={() => openModal("profile_photo")}
              mode="contained"
              style={styles.photoButton}
              labelStyle={styles.photoButtonText}
              icon={() => <Icon name="camera" size={20} color="#0000FF" />} // Blue icon
            >
              Profile Photo
            </Button>
          </View>
        
          {/* Sign Photo */}
          <View style={styles.column}>
            {formData.sign_photo && (
              <Avatar.Image size={80} source={{ uri: formData.sign_photo }} />
            )}
            <Button
              onPress={() => openModal("sign_photo")}
              mode="contained"
              style={styles.photoButton}
              labelStyle={styles.photoButtonText}
              icon={() => <Icon name="camera" size={20} color="#0000FF" />} // Blue icon
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
        

        {/* Buttons for update & delete */}
       <View style={styles.buttonsContainer}>
  <Button
    icon={() => (
      <MaterialCommunityIcons name="account-edit" size={20} color="#0000FF" />
    )}
    mode="contained"
    style={styles.buttonUpdate}
    onPress={handleSubmit}
  >
    Update
  </Button>

  {Role === "admin" && (
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
  )}
</View>

    

        {/* Success popup */}
        {visible && (
          <Animated.View style={[styles.popup, { opacity: fadeAnim }]}>
            <Text style={styles.popupText}>User Updated!</Text>
          </Animated.View>
        )}

        {/* Modal for Camera / Gallery options */}
        <Modal
          visible={modalVisible}
          transparent
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
                <Icon name="photo" size={20} color="#fff" />
                <Text style={styles.optionText}>Choose from Gallery</Text>
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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
  flex: 1,
  padding: 20,
  backgroundColor: '#07387A',
  },
    header: {
    fontSize: 20,
    fontWeight: "bold",
    padding: 10,
    backgroundColor: "#07387A",
    color: "white",
    width: "100%",
    textAlign: "center",
    paddingVertical: 20,
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
  errorText: {
  color: 'red',
  fontSize: 12,
  marginTop: 4,
  marginLeft: 8,
  fontStyle: 'italic',
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
 buttonsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 20,
  gap: 10, 
},

buttonUpdate: {
 backgroundColor: '#FFC107',
  flex: 1,
  marginRight: 5, 
},

deleteButton: {
  backgroundColor: '#ff4d4d',
  flex: 1,
  marginLeft: 5, 
},


});

export default EditEmployees;