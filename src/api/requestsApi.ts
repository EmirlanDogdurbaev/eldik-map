import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { z } from "zod";

const locationSchema = z.object({
  latitude: z.string(),
  longitude: z.string(),
});

const driverSchema = z.object({
  id: z.string(),
  user: z.string(),
  car: z.string(),
  status: z.number(),
  location_history: z.array(locationSchema),
});

const paginatedDriversSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(driverSchema),
});

const routeSchema = z.object({
  id: z.string(),
  goal: z.string().nullable(),
  departure: z.string(),
  destination: z.string(),
  request: z.string(),
  time: z.string(),
  usage_count: z.number(),
});

const requestSchema = z.object({
  id: z.string(),
  date: z.string(),
  user: z.string(),
  status: z.number(),
  comments: z.string(),
  routes: z.array(routeSchema).optional(),
  driver: z.string().nullable(),
  status_text: z.string(),
});

const paginatedRequestsSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(requestSchema),
});

export type Route = z.infer<typeof routeSchema>;
export type Request = z.infer<typeof requestSchema>;
export type PaginatedRequests = z.infer<typeof paginatedRequestsSchema>;
export type Driver = z.infer<typeof driverSchema>;
export type PaginatedDrivers = z.infer<typeof paginatedDriversSchema>;

export const requestsApi = createApi({
  reducerPath: "requestsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Requests"],
  endpoints: (builder) => ({
    getRequests: builder.query<
      PaginatedRequests,
      {
        limit?: number;
        offset?: number;
        status?: number;
        username?: string;
      }
    >({
      query: ({ limit = 10, offset = 0, status, username }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
        });

        if (status !== undefined) params.set("status", status.toString());
        if (username) params.set("username", username);

        return `fast-requests/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({
                type: "Requests" as const,
                id,
              })),
              { type: "Requests" as const },
            ]
          : [{ type: "Requests" as const }],
    }),

    getRequestById: builder.query<Request, string>({
      query: (id) => `requests/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Requests", id }],
    }),

    getDrivers: builder.query<
      PaginatedDrivers,
      { limit?: number; offset?: number }
    >({
      query: ({ limit = 10, offset = 0 }) =>
        `drivers/?limit=${limit}&offset=${offset}`,
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({
                type: "Requests" as const,
                id,
              })),
              { type: "Requests" as const },
            ]
          : [{ type: "Requests" as const }],
    }),

    updateRequest: builder.mutation<
      Request,
      {
        id: string;
        status: number;
        comments?: string;
        drivers?: Record<string, string>;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/requests/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Requests"],
    }),
  }),
});

export const {
  useGetRequestsQuery,
  useGetRequestByIdQuery,
  useGetDriversQuery,
  useUpdateRequestMutation,
} = requestsApi;
