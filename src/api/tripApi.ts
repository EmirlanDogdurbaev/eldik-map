import { createApi } from "@reduxjs/toolkit/query/react";
import type { TripRequest, TripResponse, RouteItem } from "../types/tripSchema";
import { authFetchBaseQuery } from "./authFetchBaseQuery";

export const tripApi = createApi({
  reducerPath: "tripApi",
  baseQuery: authFetchBaseQuery(),

  // ✅ Добавляем список тегов
  tagTypes: ["HistoryRoutes"],

  endpoints: (builder) => ({
    createTrip: builder.mutation<TripResponse, TripRequest[]>({
      query: (data) => ({
        url: "requests/create/",
        method: "POST",
        body: data,
      }),
      // ✅ Обозначаем, что этот запрос **инвалидирует** кеш истории
      invalidatesTags: ["HistoryRoutes"],
    }),

    getHistoryRoutes: builder.query<
      {
        count: number;
        next: string | null;
        previous: string | null;
        results: {
          routes: RouteItem[];
        };
      },
      { user_id: string; limit: number; offset: number; completed: boolean }
    >({
      query: ({ user_id, limit, offset, completed }) => ({
        url: `historyroutes/${user_id}/`,
        params: { limit, offset, completed },
      }),
      // ✅ Обозначаем, что этот запрос **зависит от** тега
      providesTags: ["HistoryRoutes"],
    }),
  }),
});

export const { useCreateTripMutation, useGetHistoryRoutesQuery } = tripApi;
