import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';


// const apiUrl = 'https://kitecareer.com/Sri_Vari_Finance_Backend/api/';

const apiUrl = 'http://127.0.0.1:8000/api/';


const api = axios.create({
    baseURL: apiUrl,
});

// Request Interceptor
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else if (config.url !== '/login') {
            Alert.alert(
                "Error",
                "Session expired. Please log in again.",
                [
                    {
                        text: "OK",
                        onPress: () => redirectToLogin(),
                    },
                ],
                { cancelable: false }
            );
            throw new axios.Cancel('No token found'); // Cancel the request
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Function to redirect to the login screen
const redirectToLogin = () => {
    const Navigation=useNavigation();
    Navigation.navigate('Login' as never); // Adjust according to your navigation setup
};

export default api;
