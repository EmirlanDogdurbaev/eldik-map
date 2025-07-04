import { createApi } from "@reduxjs/toolkit/query/react";
import { authFetchBaseQuery } from "./authFetchBaseQuery";
import {
  CarsResponseSchema,
  UserResponseSchema,
  type CarsResponse,
  type UserResponse,
} from "../types/carsSchema";
import z from "zod";

export const carsApi = createApi({
  reducerPath: "carsApi",
  baseQuery: authFetchBaseQuery(),
  tagTypes: ["Drivers", "Cars"],
  endpoints: (builder) => ({
    getCars: builder.query<CarsResponse, { limit: number; offset: number }>({
      query: ({ limit, offset }) => ({
        url: `cars/`,
        params: { limit, offset },
      }),
      transformResponse: (response: unknown) => {
        try {
          return CarsResponseSchema.parse(response);
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error("Zod validation error:", error.errors);
          }
          throw new Error("Invalid response format");
        }
      },
      providesTags: [{ type: "Cars", id: "LIST" }],
    }),
    getUserByName: builder.query<UserResponse, { name: string }>({
      query: ({ name }) => ({
        url: `users/`,
        params: { name, role: "driver" },
      }),
      transformResponse: (response: unknown) => {
        try {
          return UserResponseSchema.parse(response);
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error("Zod validation error:", error.errors);
          }
          throw new Error("Invalid user response format");
        }
      },
    }),
    updateDriverCar: builder.mutation<
      void,
      { driverId: string; driverName: string; carId: string }
    >({
      query: ({ driverId, carId }) => ({
        url: `drivers/${driverId}/`,
        method: "PATCH",
        body: { car: carId },
      }),
      async onQueryStarted({ driverName }, { dispatch, queryFulfilled }) {
        try {
          const userResponse = await dispatch(
            carsApi.endpoints.getUserByName.initiate({ name: driverName })
          ).unwrap();
          const userId = userResponse.results[0]?.id;
          if (!userId) {
            throw new Error(`Пользователь с именем "${driverName}" не найден`);
          }
          await queryFulfilled;
        } catch (error) {
          console.error("Ошибка в updateDriverCar:", error);
        }
      },
      invalidatesTags: [{ type: "Drivers", id: "LIST" }],
    }),
    createCar: builder.mutation<
      void,
      { name: string; car_type: string; number: string; main_driver: string }
    >({
      query: (body) => ({
        url: `cars/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Cars", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCarsQuery,
  useGetUserByNameQuery,
  useUpdateDriverCarMutation,
  useCreateCarMutation,
} = carsApi;
