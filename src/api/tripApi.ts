import { createApi } from "@reduxjs/toolkit/query/react";
import type { TripRequest, TripResponse } from "../types/tripSchema";
import { authFetchBaseQuery } from "./authFetchBaseQuery";

export const tripApi = createApi({
  reducerPath: "tripApi",
  baseQuery: authFetchBaseQuery(
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/"
  ),
  endpoints: (builder) => ({
    createTrip: builder.mutation<TripResponse, TripRequest[]>({
      query: (data) => ({
        url: "requests/create/",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useCreateTripMutation } = tripApi;
