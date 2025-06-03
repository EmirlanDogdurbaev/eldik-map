import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Неверный формат email").min(1, "Email обязателен"),
  password: z.string().min(6, "Пароль должен быть минимум 6 символов"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(50, "Имя слишком длинное"),
  email: z.string().email("Неверный формат email").min(1, "Email обязателен"),
  password: z.string().min(6, "Пароль должен быть минимум 6 символов"),
});

export const authResponseSchema = z.object({
  access: z.string(),
  refresh: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.string(),
  }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
