import React, { useState } from "react";
import { Button, TextInput } from "react-native-paper";
import { View, StyleSheet, Alert, Text, Image } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { useRoute } from "@react-navigation/native";
import api from "./Api";

function ChangePassword() {
  const Navigation = useNavigation();
  const router = useRouter();
  const route = useRoute();
  const { email } = route.params as { email: string };

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/reset-password", {
        email: email,
        newPassword: newPassword,
      });

      console.log("Full Response:", response);

      const responseData = response.data;

      if (responseData?.message === "Password reset successfully") {
        Alert.alert("Success", "Password reset successfully.");
        router.replace("/Login");
      } else {
        Alert.alert(
          "Error",
          responseData?.message || "An error occurred during password reset."
        );
      }
    } catch (error: any) {
      console.error("Error:", error);
      if (error.response) {
        Alert.alert(
          "Error",
          error.response.data?.message ||
            "An error occurred while processing your request."
        );
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
      {/* Uncomment if you want to show a loading indicator overlay
      {loading && (
        <View style={styles.loadingOverlay}>
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
          mode="outlined"
          label="New Password"
          value={newPassword}
          onChangeText={(text) => setNewPassword(text)}
          style={styles.input}
          secureTextEntry={!showPassword}
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />

        <TextInput
          mode="outlined"
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(text) => setConfirmPassword(text)}
          style={styles.input}
          secureTextEntry={!showPassword}
        />

        <Button
          mode="contained"
          icon="lock"
          style={styles.verifyButton}
          onPress={handleSubmit}
        >
          <Text style={styles.verifyButtonText}>SUBMIT</Text>
        </Button>
      </View>
    </>
  );
}

export default ChangePassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  backgroundColor:"#07387A",
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  input: {
    width: '100%',
    marginBottom: 20,
  },
  inputButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
  },

   verifyButton: {
    width:200,
    marginLeft:30,
    marginTop: 10,
    paddingVertical: 3,
    backgroundColor: "#E8B801",
  },
  verifyButtonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "500",
  },
  // Uncomment and customize if you implement a loading overlay
  /*
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  */
});

