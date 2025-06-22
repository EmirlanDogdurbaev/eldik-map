import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

export const authFetchBaseQuery = (
  baseUrl: string = import.meta.env.VITE_API_URL
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  const baseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  });

  let isRedirecting = false; // Флаг для предотвращения повторных редиректов

  return async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401 && !isRedirecting) {
      isRedirecting = true; // Устанавливаем флаг
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
      window.location.href = "/login";
      // Сбрасываем флаг через таймаут, чтобы разрешить будущие редиректы
      setTimeout(() => {
        isRedirecting = false;
      }, 1000);
    }

    return result;
  };
};
