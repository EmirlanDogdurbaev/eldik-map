import { z } from "zod";

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
