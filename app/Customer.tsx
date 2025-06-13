import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import {  Searchbar } from "react-native-paper";
import { createDrawerNavigator } from "@react-navigation/drawer";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Avatar } from "react-native-paper";
import { useRouter, useFocusEffect } from "expo-router"; 

import api from "./Api";
import AsyncStorage from "@react-native-async-storage/async-storage";


const Customer = () => {
  const [role, setRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const router = useRouter();
 const Drawer = createDrawerNavigator();

  // Fetch role from AsyncStorage on component mount
  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem("role");
      if (storedRole) setRole(storedRole);
    };
    fetchRole();
  }, []);

  // Fetch data on focus or filter change
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [statusFilter]) // refetch when filter changes
  );


  // Fetch customer data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/customer", {
        params: {
          status: statusFilter !== "All" ? statusFilter.toLowerCase() : undefined,
        },
      });
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  // Handle cancel search
  const handleCancelSearch = () => {
    setSearchQuery("");
  };


const filteredData = (Array.isArray(data) ? data : []).filter((item) => {
  const name = (item.user_name || "").toLowerCase();
  const id = (item.user_id || "").toLowerCase(); 
  const status = (item.status || "").trim().toLowerCase();
  const query = searchQuery.toLowerCase();

  
  const matchesSearch = name.includes(query) || id.includes(query);

  const matchesFilter =
    statusFilter === "All" ||
    (statusFilter === "Active" && status === "active") ||
    (statusFilter === "Inactive" && status === "inactive");

  return matchesSearch && matchesFilter;
});
  // Render each customer item
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      
  // Example button press
onPress={() => {
  router.replace({
    pathname: "/EditCustomer",
    params: { id: item.user_id.toString() }, // ID must be a string
  });
}}    >
      
      {/* Profile picture with status dot */}
      <View style={styles.avatarContainer}>
        <Avatar.Image
          size={50}
          source={
            item.profile_photo
              ? { uri: item.profile_photo }
              : require("@/assets/images/customer.png")
          }
        />
        {/* Status Dot */}
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                item.status === "active"
                  ? "green"
                  : item.status === "inactive"
                  ? "yellow"
                  : "gray",
            },
          ]}
        />
      </View>
      {/* Name and role */}
      <View style={styles.textContainer}>
        <Text style={styles.profileText}>{item.user_name}</Text>
         <Text style={styles.nameText}>
       Customer ID: {item.user_id}
    </Text>
       
      </View>
      <AntDesign name="right" size={20} color="#07387A" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
     

      <View style={styles.container}>
        {/* Filter Buttons */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "All" ? styles.activeFilter : styles.inactiveFilter,
            ]}
            onPress={() => setStatusFilter("All")}
          >
            <Text style={styles.filterText}>All Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "Active" ? styles.activeFilter : styles.inactiveFilter,
            ]}
            onPress={() => setStatusFilter("Active")}
          >
            <Text style={styles.filterText}>Active</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "Inactive" ? styles.activeFilter : styles.inactiveFilter,
            ]}
            onPress={() => setStatusFilter("Inactive")}
          >
            <Text style={styles.filterText}>Inactive</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Add Button */}
        <View style={styles.searchAndButtonContainer}>
          <Searchbar
            placeholder="Search"
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchContainer}
            onIconPress={handleCancelSearch}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.replace("/CreateCustomer")}
          >
            <AntDesign name="addusergroup" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Show filtered data, or message if no customer found */}
        {filteredData.length === 0 && searchQuery !== "" ? (
          <Text style={styles.emptyText}>NO CUSTOMER FOUND.</Text>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => item.user_id.toString()}
            ListEmptyComponent={
              !loading && (
                <Text style={styles.emptyText}>NO CUSTOMER FOUND.</Text>
                
              )
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default Customer;

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: "#222",
    padding: 10,
  },
  avatarContainer: {
    position: "relative",
    width: 50,
    height: 50,
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "white",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "white",
  },
  filterText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  activeFilter: {
    backgroundColor: "#07387A",
  },
  inactiveFilter: {
    backgroundColor: "#FFC107",
  },
  searchAndButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: 20,
  },
  searchContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: "#07387A",
    borderRadius: 50,
    padding: 10,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  snoContainer: {
    width: 30,
    alignItems: "center",
  },
  snoText: {
    color: "#ccc",
  },


  
  textContainer: {
  flex: 1,
    marginLeft: 15,
  },
  profileText: {
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 4, 
  },
  nameText: {
    fontSize: 14,
    color: '#fff',
  },
  userTypeText: {
    marginTop: 4,
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },

  
  emptyText: {
    textAlign: "center",
    marginTop: "60%",
    fontWeight: "bold",
    color: "#ccc",
  },
});