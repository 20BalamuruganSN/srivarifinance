import React, { useState, useRef } from "react";
import { View, StyleSheet, Image, Alert, Platform } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useNavigation, useRouter } from "expo-router";
import { TextInput as RNTextInput } from "react-native";

import { useRoute } from "@react-navigation/native";
// import { UIActivityIndicator } from "react-native-indicators";

import api from "./Api";

const Otp = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const route = useRoute();
  const { email } = route.params as { email: string };
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(RNTextInput | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!email) {
      Alert.alert("Missing Info", "Email not found. Please try again.");
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === "Backspace") {
      if (otp[index] === "") {
        // If current is empty, move back
        if (index > 0) {
          otpRefs.current[index - 1]?.focus();
          const newOtp = [...otp];
          newOtp[index - 1] = "";
          setOtp(newOtp);
        }
      } else {
        // Clear current
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const verifyOtp = async () => {
    const enteredOtp = otp.join("");
    setLoading(true);
    try {
      const response = await api.post("veraccountify-", { email: email, otp: enteredOtp });
      if (response.status === 200 && response.data) {
        const { message } = response.data;
        if (message === "OTP verified successfully") {
          router.replace({
            pathname: "/ChangePassword",
            params: { email: email },
          });
        } else {
          Alert.alert("Error", message || "An error occurred during OTP verification.");
        }
      } else {
        Alert.alert("Error", "Unexpected response from the server.");
      }
    } catch (error: any) {
      if (error.response) {
        Alert.alert("Error", error.response.data.message || "An error occurred while processing your request.");
      } else if (error.request) {
        Alert.alert("Error", "No response from the server. Please try again later.");
      } else {
        Alert.alert("Error", error.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* {loading && (
        <View style={styles.overlay}>
          <UIActivityIndicator color="white" size={30} />
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
        <View style={{ alignItems: "center" }}>
          <MaterialIcons name="verified-user" size={40} color="black" />
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              mode="outlined"
              value={digit}
              onChangeText={(value) => handleOtpChange(index, value)}
              style={styles.otpInput}
              keyboardType="numeric"
              maxLength={1}
              secureTextEntry
              theme={{
                colors: {
                  primary: "#07387A",
                  onSurface: "black",
                  outline: "#07387A",
                },
              }}
              ref={(el: any) => (otpRefs.current[index] = el)}
              onKeyPress={(e) => handleKeyPress(index, e)}
            />
          ))}
        </View>

        <Button mode="contained" onPress={verifyOtp} style={styles.verifyButton} disabled={loading}>
          <Text style={styles.verifyButtonText}>Verify OTP</Text>
        </Button>
      </View>
    </>
  );
};

export default Otp;

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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 40,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "white",
    fontSize: 24,
    textAlign: "center",
    fontWeight: "bold",
    borderColor: "#07387A",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  verifyButton: {
    width: 300,
    marginTop: 10,
    paddingVertical: 3,
    backgroundColor: "#E8B801",
  },
  verifyButtonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "500",
  },
});