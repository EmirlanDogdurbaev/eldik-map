import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
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
      window.location.href = "/login"; // Редирект на логин
    }

    return result;
  };
};
