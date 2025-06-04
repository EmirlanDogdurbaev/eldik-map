import {
  fetchBaseQuery,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { BaseQueryApi } from "@reduxjs/toolkit/query";
import { logout, setCredentials } from "../services/authSlice";

interface RefreshTokenResponse {
  access: string;
}

export const authFetchBaseQuery = (baseUrl: string) => {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as { auth: { accessToken: string | null } };
      const token =
        state.auth.accessToken || localStorage.getItem("access_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  });

  return async (
    args: string | FetchArgs,
    api: BaseQueryApi,
    extraOptions: {}
  ) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error && (result.error as FetchBaseQueryError).status === 401) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        const refreshResult = await rawBaseQuery(
          {
            url: "/token/refresh/",
            method: "POST",
            body: { refresh: refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const { access } = refreshResult.data as RefreshTokenResponse;
          localStorage.setItem("access_token", access);
          api.dispatch(
            setCredentials({
              access,
              refresh: refreshToken,
              user: {
                id: localStorage.getItem("user_id") || "",
                name: localStorage.getItem("user") || "",
                email: localStorage.getItem("email") || "",
                role: localStorage.getItem("role") || "",
              },
            })
          );

          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logout());
        }
      } else {
        api.dispatch(logout());
      }
    }

    return result;
  };
};
