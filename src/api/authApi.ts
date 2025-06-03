import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  authResponseSchema,
  type AuthResponse,
  type LoginFormData,
  type RegisterFormData,
} from "../types/authSchema";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/",
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as { auth: { accessToken: string | null } };
      const token =
        state.auth.accessToken || localStorage.getItem("access_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginFormData>({
      query: (credentials) => ({
        url: "api/login/",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response) => {
        console.log("Raw API response (login):", response);
        return authResponseSchema.parse(response);
      },
      transformErrorResponse: (response) => {
        console.log("Raw API error (login):", response);
        return { status: response.status, data: response.data };
      },
    }),
    register: builder.mutation<AuthResponse, RegisterFormData>({
      query: (data) => ({
        url: "api/register/",
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => {
        console.log("Raw API response (register):", response);
        return authResponseSchema.parse(response);
      },
      transformErrorResponse: (response) => {
        console.log("Raw API error (register):", response);
        return { status: response.status, data: response.data };
      },
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;
