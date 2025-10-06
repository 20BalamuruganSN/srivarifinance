import axios from "axios";  

const BaseUrl = axios.create({
    // baseURL:"http://192.168.141.45:8000/",
    // baseURL :'https://kitecareer.com/Sri_Vari_Finance_Backend/api/',
    // baseURL:"http://192.168.1.38:8000/api/",
      baseURL:"https://reiosglobal.com/srivarimob/api",
    headers:{'Content-type': 'application/json'}
})  
export default BaseUrl;

