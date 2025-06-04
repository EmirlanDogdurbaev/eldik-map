import { createApi } from "@reduxjs/toolkit/query/react";
import {
  type LoginFormData,
  type RegisterFormData,
  type VerifyFormData,
  type AuthResponse,
  authResponseSchema,
} from "../types/authSchema";
import { authFetchBaseQuery } from "./authFetchBaseQuery";

interface RefreshTokenResponse {
  access: string;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: authFetchBaseQuery(
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/"
  ),
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginFormData>({
      query: (credentials) => ({
        url: "login/",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response) => authResponseSchema.parse(response),
      transformErrorResponse: (response) => ({
        status: response.status,
        data: response.data,
      }),
    }),
    register: builder.mutation<{ message: string }, RegisterFormData>({
      query: (data) => ({
        url: "register/",
        method: "POST",
        body: data,
      }),
      transformErrorResponse: (response) => ({
        status: response.status,
        data: response.data,
      }),
    }),
    confirm: builder.mutation<AuthResponse, VerifyFormData>({
      query: (data) => ({
        url: "confirm/",
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => authResponseSchema.parse(response),
      transformErrorResponse: (response) => ({
        status: response.status,
        data: response.data,
      }),
    }),
    refreshToken: builder.mutation<RefreshTokenResponse, void>({
      query: () => ({
        url: "token/refresh/",
        method: "POST",
        body: { refresh: localStorage.getItem("refresh_token") || "" },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useConfirmMutation,
  useRefreshTokenMutation,
} = authApi;
