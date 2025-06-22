import { createApi } from "@reduxjs/toolkit/query/react";
import { z } from "zod";
import { authFetchBaseQuery } from "./authFetchBaseQuery";

export const CarSchema = z.object({
  id: z.string(),
  name: z.string(),
  car_type: z.string(),
  number: z.string(),
});

export const CarsResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(CarSchema),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const UserResponseSchema = z.object({
  count: z.number(),
  results: z.array(UserSchema),
});

export type Car = z.infer<typeof CarSchema>;
export type CarsResponse = z.infer<typeof CarsResponseSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;

export const carsApi = createApi({
  reducerPath: "carsApi",
  baseQuery: authFetchBaseQuery(
    import.meta.env.VITE_API_URL || "http://localhost:8000/api"
  ),
  tagTypes: ["Drivers"],
  endpoints: (builder) => ({
    getCars: builder.query<CarsResponse, { limit: number; offset: number }>({
      query: ({ limit, offset }) => ({
        url: `/cars/`,
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
    }),
    getUserByName: builder.query<UserResponse, { name: string }>({
      query: ({ name }) => ({
        url: `/users/`,
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
      async queryFn({ driverId, driverName, carId }, { dispatch }) {
        try {
          console.log(`Запрос ID пользователя для имени: ${driverName}`);
          const userResponse = await dispatch(
            carsApi.endpoints.getUserByName.initiate({ name: driverName })
          ).unwrap();

          console.log("Ответ /users/:", userResponse);
          const userId = userResponse.results[0]?.id;
          if (!userId) {
            throw new Error(`Пользователь с именем "${driverName}" не найден`);
          }

          console.log(`Отправка PATCH на /drivers/${driverId}/ с телом:`, {
            user: userId,
            car: carId,
          });
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:8000/api"
            }/drivers/${driverId}/`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${
                  localStorage.getItem("access_token") || ""
                }`,
              },
              body: JSON.stringify({ user: userId, car: carId }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Ошибка PATCH-запроса:", errorData);
            throw errorData;
          }

          console.log("PATCH-запрос успешен");
          return { data: undefined };
        } catch (error) {
          console.error("Ошибка в updateDriverCar:", error);
          return { error: error as any };
        }
      },
      invalidatesTags: [{ type: "Drivers", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCarsQuery,
  useGetUserByNameQuery,
  useUpdateDriverCarMutation,
} = carsApi;
