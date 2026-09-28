import axios from "axios";
import Cookies from "js-cookie";

const VITE_APP_BASE_URL = import.meta.env.VITE_API_URL

export const apiClient = axios.create({
    baseURL:VITE_APP_BASE_URL,
});

export function clearSessionCookies(){
    Cookies.remove("ACCEESS_TOKEN");
    Cookies.remove("REFRESH_TOKEN");
    Cookies.remove("USER_ID");
}

// AuthProvider registers this so a failed refresh logs the user out of the UI too
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null){
    onSessionExpired = handler;
}

// Refresh tokens are single-use (rotated), so concurrent 401s must share one refresh call
let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
    // Bare axios, not apiClient: a 401 from /auth/refresh must not re-enter this interceptor
    const {data} = await axios.post(`${VITE_APP_BASE_URL}/auth/refresh`,{
        refreshToken:Cookies.get("REFRESH_TOKEN")
    });
    Cookies.set("ACCEESS_TOKEN",data.accessToken,{expires:1/96});
    Cookies.set("REFRESH_TOKEN",data.refreshToken,{expires:7});
    return data.accessToken;
}

apiClient.interceptors.request.use((config)=>{
    const token = Cookies.get("ACCEESS_TOKEN");
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config
});

apiClient.interceptors.response.use((reponse)=>reponse,async(error)=>{
    const config = error?.config;
    const isAuthRequest = config?.url?.startsWith('/auth/');

    // A 401 from login/register/logout is a real answer, not an expired access token
    if(error?.response?.status === 401 && config && !config._retry && !isAuthRequest){
        config._retry = true;

        try {
            refreshInFlight ??= refreshAccessToken().finally(()=>{ refreshInFlight = null; });
            await refreshInFlight;
            return apiClient(config);
        } catch (refreshError) {
            clearSessionCookies();
            onSessionExpired?.();
            return Promise.reject(refreshError);
        }
    }
    return Promise.reject(error);
})
