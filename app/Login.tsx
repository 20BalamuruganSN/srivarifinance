import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
} from "react-native";
import { TextInput, Text } from "react-native-paper";
// import UIActivityIndicator from "react-native-indicators";

import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "./Api"; 
import { useRouter } from "expo-router";
import { AxiosError } from "axios";

const Login = () => {
  const [formData, setFormData] = useState({
    user_id: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    user_id: "",
    password: "",
  });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    let valid = true;
    let useridError = "";
    let passwordError = "";

    if (!formData.user_id) {
      useridError = "User ID is required";
      valid = false;
    }
    if (!formData.password) {
      passwordError = "Password is required";
      valid = false;
    } else if (formData.password.length < 4) {
      passwordError = "Password must be at least 4 characters";
      valid = false;
    }

    setErrors({ user_id: useridError, password: passwordError });
    return valid;
  };
const handleSignIn = async () => {
  if (validateForm()) {
    setLoading(true);
    try {
      const response = await api.post("/login", {
        user_id: formData.user_id,
        password: formData.password,
      });

      console.log("API Response:", response);

      if (response.status === 200) {
        const { token, role, user_id } = response.data;

        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("role", role);
        await AsyncStorage.setItem("userid", user_id.toString());

        if (role === "admin") {
          router.replace("/(tabs)");
        } else if (role === "employee") {
          router.replace("/(tabs)" as never);
        } else {
          Alert.alert("Login Failed", "Users Not allowed to Admin Page");
        }
      } else {
        Alert.alert("Error", "Invalid response from server");
      }
    } catch (error) {
      const err = error as AxiosError<any>;
      console.log("Login Error:", err);

      if (err.response) {
        const errorMsg = err.response.data?.error;

        if (err.response.status === 401) {
          if (errorMsg === "Unauthorized") {
            Alert.alert("Error", "Invalid email or password");
          } else if (errorMsg === "Incorrect password") {
            Alert.alert("Error", "Incorrect password");
          } else {
            Alert.alert("Error", `Error: ${errorMsg}`);
          }
        } else {
          Alert.alert("Warning", `Warning: ${errorMsg}`);
        }
      } else if (err.request) {
        Alert.alert("Error", "No response from server");
      } else {
        Alert.alert("Error", "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }
};
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Logo Section */}
      <View style={styles.logoCircleContainer}>
        <View style={styles.circle}>
          <Image
            source={require("@/assets/images/Srivari.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* User ID Input */}
      <View style={styles.inputBox}>
        <TextInput
          label="Enter a User ID (e.g., a001)"
          value={formData.user_id}
          onChangeText={(text) => handleInputChange("user_id", text)}
          style={[styles.input, { color: "white" }]}
          underlineColor="white"
            activeUnderlineColor="white"
          theme={{
            colors: {
              text: "white",
              placeholder: "white",
              primary: "white",
              onSurface: "white",  
            },
          }}
          right={
            <TextInput.Icon
              icon={() => <AntDesign name="user" size={20} color="white" />}
            />
          }
        />
        {errors.user_id ? (
          <Text style={styles.errorText}>{errors.user_id}</Text>
        ) : null}
      </View>

      {/* Password Input */}
      <View style={styles.inputBox}>
        <TextInput
          label="Password"
          value={formData.password}
          onChangeText={(text) => handleInputChange("password", text)}
          secureTextEntry={!showPassword}
         style={[styles.input, { color: "white" }]}
          underlineColor="white"
           
  activeUnderlineColor="white"
          theme={{
            colors: {
              text: "white",
              placeholder: "white",
              primary: "white",
              onSurface: "white",   
            },
          }}
          right={
            <TextInput.Icon
              icon={showPassword ? "eye" : "eye-off"}
              onPress={() => setShowPassword(!showPassword)}
              color="white"
            />
          }
        />
        {errors.password ? (
          <Text style={styles.errorText}>{errors.password}</Text>
        ) : null}
      </View>

      {/* Loader */}
      {/* {loading && (
        <View style={styles.loadingOverlay}>
          <UIActivityIndicator color="white" />
        </View>
      )} */}

      {/* Forgot Password */}
      <TouchableOpacity
        style={styles.forgotPassword}
        onPress={() => router.replace("Forgetpassword" as never)}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Sign In Button */}
      <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
        <Text style={styles.signInText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07387A",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  logoCircleContainer: {
    alignItems: "center",
    marginBottom: 30,
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
  inputBox: {
   
    marginBottom: 20,
  },
  input: {
    backgroundColor: "transparent",
    fontSize: 14,
    color:'white'
  },
  signInButton: {
    backgroundColor: "#E8B801",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 25,
  },
  signInText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  forgotPassword: {
    marginTop: 15,
    marginRight:200,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "#E8B801",
    fontSize: 14,
    fontWeight:700,
    textDecorationLine: "none",
  },
  loadingOverlay: {
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
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});


