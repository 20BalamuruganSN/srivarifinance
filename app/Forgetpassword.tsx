import React, { useState } from "react";
import { View, StyleSheet, Image, Alert, Text } from "react-native";
import { TextInput, Button, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import api from "./Api";
import { useRouter } from "expo-router";


const VerifyScreen = () => {
//   const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "" });
  const [errors, setErrors] = useState({ email: "" });
  const theme = useTheme();
  const router = useRouter();

  // ✅ Handle Input Change Function
  const handleInputChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" }); 
  };

  // ✅ Validate Form Function
  const validateForm = () => {
    let isValid = true;
    let emailError = "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      emailError = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      emailError = "Please enter a valid email address";
      isValid = false;
    }

    setErrors({ email: emailError });
    return isValid;
  };

  // ✅ Handle Verify Function
  const handleVerify = async () => {
    if (!validateForm()) return;

   
    try {
      console.log("****************************88");

      const response = await api.post("send-otp", { email: formData.email });
      console.log(response);


      if (response.status === 200 && response.data) {
        Alert.alert("Success", "Check your email for the OTP!");
      router.replace({
  pathname: "/Otp",
  params: { email: formData.email }
});

      } else {
        Alert.alert("Error  mjlkhik", "Unexpected response from the server.");
      }
    } catch (error: any) {
      if (error.response) {
        Alert.alert("Error response", error.response.data.message || "An error occurred.");
      } else if (error.request) {
        Alert.alert("Error request", "No response from the server. Please try again.");
      } else {
        Alert.alert("Error", error.message || "An unexpected error occurred.");
      }
    } finally {
      
    }
  };

  return (
    <>
      {/* {loading && (
        <View style={styles.overlay}>
          <UIActivityIndicator color="white" />
        </View>
      )} */}

      <View style={styles.container}>
       <View style={styles.logoCircleContainer}>
              <View style={styles.circle}>
                <Image
                  source={require("@/assets/images/Srivari.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>
      

        <TextInput
          label="Email"
          value={formData.email}
          onChangeText={(text) => handleInputChange("email", text)}
          mode="outlined"
          placeholder="example@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

        <Button mode="contained" onPress={handleVerify} style={styles.verifyButton}>
          <Text style={styles.verifyButtonText}>Get OTP</Text>
        </Button>
      </View>
    </>
  );
};


export default VerifyScreen;


const styles = StyleSheet.create({

   logoCircleContainer: {
    alignItems: "center",
    marginBottom: 100,
  },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 4,
    borderLeftWidth: 1,
    borderTopColor: "#00000040",
    borderRightColor: "#00000040",
    borderBottomColor: "#00000040",
    borderLeftColor: "#00000040",
  },
  logo: {
    width: 100,
    height: 100,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#07387A",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "white",
    marginTop: 20,
  },
  input: {
    // marginLeft:80,
    // width:500,
    marginBottom: 30,
  },
  verifyButton: {
    width:300,
    // marginLeft:180,
    marginTop: 10,
    paddingVertical: 3,
    backgroundColor: "#E8B801",
  },
  verifyButtonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "500",
  },
 
  errorText: {
    color: "red",
    marginBottom: 10,
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
    zIndex: 2000,
  },
});


