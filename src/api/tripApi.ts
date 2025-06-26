import { createApi } from "@reduxjs/toolkit/query/react";
import type { TripRequest, TripResponse, RouteItem } from "../types/tripSchema";
import { authFetchBaseQuery } from "./authFetchBaseQuery";

export const tripApi = createApi({
  reducerPath: "tripApi",
  baseQuery: authFetchBaseQuery(),

  tagTypes: ["HistoryRoutes"],

  endpoints: (builder) => ({
    createTrip: builder.mutation<TripResponse, TripRequest[]>({
      query: (data) => ({
        url: "requests/create/",
        method: "POST",
        body: data,
      }),
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
      providesTags: ["HistoryRoutes"],
    }),

    updateRouteTime: builder.mutation<
      void,
      {
        requestId: string;
        routeId: string;
        data: { action: "start" | "end"; time: string; odometer: number };
      }
    >({
      query: ({ requestId, routeId, data }) => ({
        url: `requests/${requestId}/routes/${routeId}/time`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["HistoryRoutes"],
    }),
  }),
});

export const {
  useCreateTripMutation,
  useGetHistoryRoutesQuery,
  useUpdateRouteTimeMutation,
} = tripApi;
