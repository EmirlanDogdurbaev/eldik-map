import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthResponse } from "../types/authSchema";

const storedAccessToken = localStorage.getItem("access_token");
const storedRefreshToken = localStorage.getItem("refresh_token");
const storedUserName = localStorage.getItem("user");
const storedEmail = localStorage.getItem("email");
const storedRole = localStorage.getItem("role");
const storedID = localStorage.getItem("user_id");

const initialUser =
  storedUserName && storedEmail && storedRole && storedID
    ? {
        id: storedID,
        name: storedUserName,
        email: storedEmail,
        role: storedRole,
      }
    : null;

interface AuthState {
  user: { name: string; email: string; role: string; id: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: initialUser,
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
  isAuthenticated: !!storedAccessToken && !!initialUser,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
