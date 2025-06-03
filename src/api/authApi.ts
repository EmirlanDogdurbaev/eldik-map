import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  loginResponseSchema,
  type LoginFormData,
  type LoginResponse,
} from "../types/authSchema";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/",
  }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginFormData>({
      query: (credentials) => ({
        url: "api/login/",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response) => {
        return loginResponseSchema.parse(response);
      },
      transformErrorResponse: (response) => {
        return { status: response.status, data: response.data };
      },
    }),
  }),
});

export const { useLoginMutation } = authApi;
