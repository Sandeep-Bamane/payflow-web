import { useEffect, useState, type ReactNode } from "react"
import { apiClient, clearSessionCookies, setSessionExpiredHandler } from "../api/client";
import Cookies from "js-cookie";
import { AuthContext } from "./authContext";

type UserTokenInfo = {
    accessToken:string,
    refreshToken:string,
    userId:string
}

export function AuthProvider({children}:{children:ReactNode}){
 // Cookies are readable synchronously, so the first render already knows the session
 const [userId,setUserId] = useState<string|undefined>(()=>Cookies.get("USER_ID"));

 // Refresh failed in the API client → drop userId so ProtectedRoute redirects to /login
 useEffect(()=>{
    setSessionExpiredHandler(()=>setUserId(undefined));
    return ()=>setSessionExpiredHandler(null);
 },[]);

 const saveDataIntoCookies = (data:UserTokenInfo) =>{
    Cookies.set("ACCEESS_TOKEN",data.accessToken,{expires:1/96});
    Cookies.set("REFRESH_TOKEN",data.refreshToken,{expires:7});
    Cookies.set("USER_ID",data.userId);
    setUserId(data.userId);
 }

 const login = async (email:string,password:string) => {
    const {data} = await apiClient.post('/auth/login',{email,password});
    saveDataIntoCookies(data);
 }

 const register = async (email:string,password:string)=> {
    const {data} = await apiClient.post('/auth/register',{email,password});
    saveDataIntoCookies(data);
 }

 const logout = async () =>{
    try {
       await apiClient.post('/auth/logout',{refreshToken:Cookies.get("REFRESH_TOKEN")});
    } finally {
       // Log out locally even if the server call fails
       clearSessionCookies();
       setUserId(undefined);
    }
 }

return <AuthContext.Provider value={{userId,login,register,logout}}>{children}</AuthContext.Provider>
}