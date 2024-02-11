import axios from "axios";
import { apiUrl } from '@/constants';


const apiClient = axios.create({
    baseURL: apiUrl,
});

apiClient.interceptors.request.use((config) => {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
    config.headers.timezone = timeZone;
    return config;
}, (error) => {
    return Promise.reject(error);
});

apiClient.interceptors.response.use((response) => {
    return response;
}, (error) => {

    return Promise.reject(error);
});


export default apiClient;