import { createApi } from "@reduxjs/toolkit/query/react";
import {
  type LoginFormData,
  type RegisterFormData,
  type VerifyFormData,
  type AuthResponse,
  authResponseSchema,
} from "../types/authSchema";
import { authFetchBaseQuery } from "./authFetchBaseQuery";
import { toast } from "react-toastify";
import { getFirebaseMessaging, requestForToken } from "../firebase";
import { deleteToken } from "firebase/messaging";

interface RefreshTokenResponse {
  access: string;
}

interface SaveFCMTokenResponse {
  message: string;
}

export const deleteFCMToken = async () => {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    console.log("Firebase messaging не инициализирован");
    return;
  }
  try {
    await deleteToken(messaging);
  } catch (error) {
    console.error("Error deleting FCM token:", error);
  }
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: authFetchBaseQuery(),
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
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("refresh_token", data.refresh);

          await deleteFCMToken();
          const currentToken = await requestForToken();
          if (
            currentToken &&
            typeof currentToken === "string" &&
            currentToken.length > 0
          ) {
            try {
              await dispatch(
                authApi.endpoints.saveFCMToken.initiate({
                  fcm_token: currentToken,
                })
              ).unwrap();
            } catch (fcmError) {
              console.error("Ошибка сохранения FCM токена:", fcmError);
            }
          } else {
            toast.warn("Не удалось получить FCM токен. Разрешите уведомления.");
          }
        } catch (error) {
          console.error("Ошибка логина:", error);
          toast.error("Ошибка входа");
        }
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "logout/",
        method: "POST",
      }),
      async onQueryStarted(_, {}) {
        try {
          await deleteFCMToken();
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        } catch (error) {
          console.error("Logout error:", error);
        }
      },
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
    saveFCMToken: builder.mutation<SaveFCMTokenResponse, { fcm_token: string }>(
      {
        query: (data) => {
          return {
            url: "save-fcm-token/",
            method: "POST",
            body: data,
          };
        },
        transformErrorResponse: (response) => {
          return {
            status: response.status,
            data: response.data,
          };
        },
        extraOptions: { maxRetries: 0 },
      }
    ),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useConfirmMutation,
  useRefreshTokenMutation,
  useSaveFCMTokenMutation,
} = authApi;
