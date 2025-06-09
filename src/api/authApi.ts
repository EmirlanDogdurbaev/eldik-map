import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "",
  prepareHeaders: (headers, { endpoint }) => {
    const publicEndpoints = ["login", "register", "confirm", "refreshToken"];
    if (!publicEndpoints.includes(endpoint)) {
      const token = localStorage.getItem("access_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const authFetchBaseQuery = (
  baseUrl: string
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  return async (args, api, extraOptions) => {
    const result = await baseQuery(
      {
        ...(typeof args === "object" ? args : {}),
        url: `${baseUrl}${typeof args === "string" ? args : args.url}`,
      },
      api,
      extraOptions
    );

    if (result.error && result.error.status === 401) {
      console.warn(
        "Токен недействителен или отсутствует, перенаправление на /login"
      );
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
      window.location.href = "/login";
    }

    return result;
  };
};

import { createApi } from "@reduxjs/toolkit/query/react";
import {
  type LoginFormData,
  type RegisterFormData,
  type VerifyFormData,
  type AuthResponse,
  authResponseSchema,
} from "../types/authSchema";

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
