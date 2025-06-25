import { z } from "zod";

export const paginatedUsersSchema = z.object({
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
      subdepartment: z.string(),
    })
  ),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  number: z
    .string()
    .optional()
    .transform((val) => val ?? ""),
  role: z.enum(["dispetcher", "user", "driver", "admin"]),
  subdepartment: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type PaginatedUsers = {
  users: User[];
  count: number;
  next: string | null;
  previous: string | null;
};
