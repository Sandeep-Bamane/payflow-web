import { createContext, useContext } from "react"

export type AuthContextType = {
    userId:string|undefined,
    email:string|undefined,
    login:(email:string,password:string)=>Promise<void>,
    register:(email:string,password:string)=>Promise<void>,
    logout:()=>Promise<void>
}

// Kept apart from AuthProvider.tsx so that file only exports a component (React fast refresh)
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(){
   const context = useContext(AuthContext);
   if(context === undefined){
      throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
}
