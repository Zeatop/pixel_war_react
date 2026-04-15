import {createContext} from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  isAdmin: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);


