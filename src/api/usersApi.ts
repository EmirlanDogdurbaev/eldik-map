import { createApi } from "@reduxjs/toolkit/query/react";
import { z } from "zod";
import { authFetchBaseQuery } from "./authFetchBaseQuery";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  number: z
    .string()
    .optional()
    .transform((val) => val ?? ""),
  role: z.enum(["dispetcher", "user", "driver", "admin"]),
});

const paginatedUsersSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      number: z
        .string()
        .optional()
        .transform((val) => val ?? ""),
      role: z.string(),
    })
  ),
});

export type User = z.infer<typeof userSchema>;
export type PaginatedUsers = {
  users: User[];
  count: number;
  next: string | null;
  previous: string | null;
};

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: authFetchBaseQuery(
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/"
  ),
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    getUsers: builder.query<
      PaginatedUsers,
      {
        limit: number;
        offset: number;
        name?: string;
        email?: string;
        role?: string;
      }
    >({
      query: ({ limit, offset, name, email, role }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
        });
        if (name) params.append("name", name);
        if (email) params.append("email", email);
        if (role) params.append("role", role);
        return `users/?${params.toString()}`;
      },
      transformResponse: (response: unknown) => {
        const parsed = paginatedUsersSchema.parse(response);
        const users = parsed.results
          .map((user) => ({
            ...user,
            role:
              user.role.toLowerCase() === "dispatcher"
                ? "dispetcher"
                : user.role.toLowerCase(),
          }))
          .filter((user) => userSchema.safeParse(user).success) as User[];
        return {
          users,
          count: parsed.count,
          next: parsed.next,
          previous: parsed.previous,
        };
      },
      providesTags: ["Users"],
    }),
    updateUserRole: builder.mutation<User, { id: string; role: string }>({
      query: ({ id, role }) => {
        const normalizedRole =
          role.toLowerCase() === "dispatcher"
            ? "dispetcher"
            : role.toLowerCase();
        return {
          url: `users/${id}/`,
          method: "PATCH",
          body: { role: normalizedRole },
        };
      },
      transformResponse: (response: unknown) => {
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
    createUser: builder.mutation<
      User,
      { name: string; email: string; number?: string; role: string }
    >({
      query: (body) => ({
        url: "users/",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) => {
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
  }),
});

export const {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useCreateUserMutation,
} = usersApi;
