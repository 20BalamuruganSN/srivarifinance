import axios from "axios";  

const BaseUrl = axios.create({
    // baseURL:"http://192.168.141.45:8000/",
    // baseURL :'https://kitecareer.com/Sri_Vari_Finance_Backend/api/',
    baseURL:"http://192.168.1.20:8000/api/",
    headers:{'Content-type': 'application/json'}
})  
export default BaseUrl;
