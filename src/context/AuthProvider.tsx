import { useEffect, useState, type ReactNode } from "react"
import { apiClient, clearSessionCookies, setSessionExpiredHandler } from "../api/client";
import Cookies from "js-cookie";
import { AuthContext } from "./authContext";

type UserTokenInfo = {
    accessToken:string,
    refreshToken:string,
    userId:string,
    email:string
}

export function AuthProvider({children}:{children:ReactNode}){
 // Cookies are readable synchronously, so the first render already knows the session
 const [userId,setUserId] = useState<string|undefined>(()=>Cookies.get("USER_ID"));
 const [email,setEmail] = useState<string|undefined>(()=>Cookies.get("USER_EMAIL"));

 // Refresh failed in the API client → drop userId so ProtectedRoute redirects to /login
 useEffect(()=>{
    setSessionExpiredHandler(()=>{
       setUserId(undefined);
       setEmail(undefined);
    });
    return ()=>setSessionExpiredHandler(null);
 },[]);

 const saveDataIntoCookies = (data:UserTokenInfo) =>{
    Cookies.set("ACCEESS_TOKEN",data.accessToken,{expires:1/96});
    Cookies.set("REFRESH_TOKEN",data.refreshToken,{expires:7});
    Cookies.set("USER_ID",data.userId);
    Cookies.set("USER_EMAIL",data.email);
    setUserId(data.userId);
    setEmail(data.email);
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
       setEmail(undefined);
    }
 }

return <AuthContext.Provider value={{userId,email,login,register,logout}}>{children}</AuthContext.Provider>
}
