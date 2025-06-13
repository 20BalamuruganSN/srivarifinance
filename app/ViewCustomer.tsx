import React, { useState } from "react";
import {
  Text,
  View,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";

import { useRoute } from "@react-navigation/native";
import api from "./Api";
import { useFocusEffect } from "@react-navigation/native";

function ViewCustomer() {
  const route = useRoute();
  const { id, city } = route.params as { id: string; city: string };
  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // console.log(id);
  useFocusEffect(
    React.useCallback(() => {
      const fetchCustomerData = async () => {
        setLoading(true);
        setError("");
        try {
          const response = await api.get(`/loans-date/${id}`);

          // Assuming response.data contains the full customer object as per your message
          if (response.data && response.data.customer) {
            setCustomerData(response.data.customer);
          } else {
            setError("No customer data found.");
          }
        } catch (error) {
          console.error("Error fetching Customer Data:", error);
          setError("Failed to load customer data.");
        } finally {
          setLoading(false);
        }
      };

      fetchCustomerData();
    }, [city, id])
  );

  if (loading) {
    return (
      <View style={styles.overlay}>
        {/* Loading indicator can be added here if needed */}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!customerData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No customer data found.</Text>
      </View>
    );
  }

  // Default image URL for placeholder
  const defaultImageUri = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

  // Function to decide image source
  const getImageSource = (uri?: string) => {
    return uri && uri.trim() !== "" ? { uri } : { uri: defaultImageUri };
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.header}>Customer Details</Text>

        <Text style={styles.label}>Profile Photo</Text>
        <View style={{ alignItems: "center" }}>
          <Image
            source={getImageSource(customerData.profile_photo)}
            style={[styles.image, styles.circularImage]}
          />
        </View>

        <Text style={styles.label}>ID:</Text>
        <Text style={styles.infoText}>{customerData.user_id}</Text>

        <Text style={styles.label}>Name:</Text>
        <Text style={styles.infoText}>{customerData.user_name}</Text>

        <Text style={styles.label}>Address:</Text>
        <Text style={styles.infoText}>{customerData.address}</Text>

        <Text style={styles.label}>Mobile:</Text>
        <Text style={styles.infoText}>{customerData.mobile_number}</Text>

        <Text style={styles.label}>City:</Text>
        <Text style={styles.infoText}>{customerData.city}</Text>

        <Text style={styles.label}>District:</Text>
        <Text style={styles.infoText}>{customerData.district}</Text>

        {/* Reference User ID */}
        <Text style={styles.label}>Reference User ID:</Text>
        <Text style={styles.infoText}>{customerData.ref_user_id}</Text>

        {/* Reference Name */}
        <Text style={styles.label}>Reference Name:</Text>
        <Text style={styles.infoText}>{customerData.ref_name}</Text>

        {/* Sign Photo */}
        <Text style={styles.label}>Sign Photo</Text>
        <View style={{ alignItems: "center" }}>
          <Image
            source={getImageSource(customerData.sign_photo)}
            style={[styles.image, styles.circularImage]}
          />
        </View>

        {/* Nominee Photo */}
        <Text style={styles.label}>Nominee Photo</Text>
        <View style={{ alignItems: "center" }}>
          <Image
            source={getImageSource(customerData.nominee_photo)}
            style={[styles.image, styles.circularImage]}
          />
        </View>

        {/* Transaction Proof */}
        <Text style={styles.label}>Transaction Proof</Text>
        <View style={{ alignItems: "center" }}>
          <Image
            source={getImageSource(customerData.image)}
            style={[styles.image, styles.circularImage]}
          />
        </View>

        {/* Vehicle Photos */}
        <Text style={styles.label}>Vehicle Front Photo</Text>
        <View style={{ alignItems: "center" }}>
          <Image
            source={getImageSource(customerData.vehicle_exterior_photo_front)}
            style={[styles.image, styles.circularImage]}
          />
        </View>

        <Text style={styles.label}>Vehicle Back Photo</Text>
        <View style={{ alignItems: "center" }}>
          <Image
            source={getImageSource(customerData.vehicle_exterior_photo_back)}
            style={[styles.image, styles.circularImage]}
          />
        </View>

        <Text style={styles.label}>Vehicle Left Photo</Text>
        <View style={{ alignItems: "center" }}>
          <Image
            source={getImageSource(customerData.vehicle_exterior_photo_left)}
            style={[styles.image, styles.circularImage]}
          />
        </View>

        <Text style={styles.label}>Vehicle Right Photo</Text>
        <View style={{ alignItems: "center" }}>
          <Image
            source={getImageSource(customerData.vehicle_exterior_photo_right)}
            style={[styles.image, styles.circularImage]}
          />
        </View>

        {/* Odometer Photo */}
        <Text style={styles.label}>Odometer Photo</Text>
        <View style={{ alignItems: "center" }}>
          <Image
            source={getImageSource(customerData.odometer_reading_photo)}
            style={[styles.image, styles.circularImage]}
          />
        </View>

        {/* VIN Number Photo */}
        <Text style={styles.label}>VIN Number Photo</Text>
        <View style={{ alignItems: "center" }}>
          <Image
            source={getImageSource(customerData.VIN_plate_number_photo)}
            style={[styles.image, styles.circularImage]}
          />
        </View>

        {/* Engine Number Photo */}
        <Text style={styles.label}>Engine Number Photo</Text>
        <View style={{ alignItems: "center" }}>
          <Image
            source={getImageSource(customerData.engine_number_photo)}
            style={[styles.image, styles.circularImage]}
          />
        </View>

        {/* Chassis Number Photo */}
        <Text style={styles.label}>Chassis Number Photo</Text>
        <View style={{ alignItems: "center" }}>
          <Image
            source={getImageSource(customerData.chassis_number_photo)}
            style={[styles.image, styles.circularImage]}
          />
        </View>
      </ScrollView>
    </View>
  );
}

export default ViewCustomer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
    marginTop: 50,
    justifyContent: "flex-start",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffe6e6",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 18,
    textAlign: "center",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  profileimage: {
    width: 120,
    height: 120,
    borderRadius: 100,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  image: {
    width: "80%",
    height: 200,
    marginTop: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },

  // Style for circular images
  circularImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  infoText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
    textAlign: "right",
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "left",
  },
});