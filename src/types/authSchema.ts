import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Неверный формат email").min(1, "Email обязателен"),
  password: z.string().min(6, "Пароль должен быть минимум 6 символов"),
});

export const registerSchema = z.object({
  email: z.string().email("Неверный формат email").min(1, "Email обязателен"),
  name: z.string().min(1, "Имя обязательно").max(50, "Имя слишком длинное"),
  number: z
    .string()
    .regex(/^\+?\d{10,15}$/, "Неверный формат номера телефона")
    .min(1, "Номер телефона обязателен"),
  password: z.string().min(6, "Пароль должен быть минимум 6 символов"),
  role: z.literal("user"),
  subdepartment: z
    .string()
    .min(1, "Отдел обязателен")
    .max(100, "Название отдела слишком длинное"),
});

export const verifySchema = z.object({
  email: z.string().email("Неверный формат email").min(1, "Email обязателен"),
  code: z.string().min(4, "Код должен быть минимум 4 символа"),
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
export type VerifyFormData = z.infer<typeof verifySchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
