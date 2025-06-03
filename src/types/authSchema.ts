import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Неверный формат email").min(1, "Email обязателен"),
  password: z.string().min(6, "Пароль должен быть минимум 6 символов"),
});

export const loginResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.string(),
  })
  .transform((data) => ({
    token: data.id,
    user: {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
    },
  }));

export type LoginFormData = z.infer<typeof loginSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
