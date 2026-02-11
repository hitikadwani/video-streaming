export interface User {
    id: number;
    email: string;
    displayName: string | null;
}
  
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}