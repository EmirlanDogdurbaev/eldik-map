import { createApi } from "@reduxjs/toolkit/query/react";
import type { TripRequest, TripResponse } from "../types/tripSchema";
import { authFetchBaseQuery } from "./authFetchBaseQuery";

export const tripApi = createApi({
  reducerPath: "tripApi",
  baseQuery: authFetchBaseQuery(),
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
