import { createApi } from "@reduxjs/toolkit/query/react";
import { z } from "zod";
import { authFetchBaseQuery } from "./authFetchBaseQuery";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  number: z.string().optional(), // Опционально, без строгой валидации
  role: z.enum(["admin", "dispetcher", "user", "driver"]),
});

export type User = z.infer<typeof userSchema>;

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: authFetchBaseQuery(
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/"
  ),
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "users/",
      transformResponse: (response: unknown) => {
        console.log("Сырой ответ /api/users/:", response); // Логирование
        return z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              email: z.string().email(),
              number: z.string().optional(),
              role: z.string(), // Принимаем любую строку
            })
          )
          .parse(response)
          .map((user) => ({
            ...user,
            role:
              user.role.toLowerCase() === "dispatcher"
                ? "dispetcher"
                : user.role.toLowerCase(),
          }))
          .filter((user) => userSchema.safeParse(user).success) as User[];
      },
      providesTags: ["Users"],
    }),
    updateUserRole: builder.mutation<User, { id: string; role: string }>({
      query: ({ id, role }) => {
        const normalizedRole =
          role.toLowerCase() === "dispatcher"
            ? "dispetcher"
            : role.toLowerCase();
        console.log("Отправка PATCH /api/users/:id с ролью:", normalizedRole);
        return {
          url: `users/${id}/`,
          method: "PATCH",
          body: { role: normalizedRole },
        };
      },
      transformResponse: (response: unknown) => {
        console.log("Ответ PATCH /api/users/:id:", response);
        return userSchema.parse({
          ...(typeof response === "object" && response !== null
            ? response
            : {}),
          role:
            (response as any).role.toLowerCase() === "dispatcher"
              ? "dispetcher"
              : (response as any).role.toLowerCase(),
        });
      },
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `users/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} = usersApi;
