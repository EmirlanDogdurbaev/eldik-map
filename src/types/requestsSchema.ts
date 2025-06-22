import z from "zod";

export const locationSchema = z.object({
  latitude: z.string(),
  longitude: z.string(),
});

export const driverSchema = z.object({
  id: z.string(),
  user: z.string(),
  car: z.string().optional(),
  status: z.number().optional(),
  location_history: z.array(locationSchema).optional(),
});

export const paginatedDriversSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(driverSchema),
});

export const routeSchema = z.object({
  id: z.string(),
  goal: z.string().nullable(),
  departure: z.string(),
  destination: z.string(),
  request: z.string(),
  time: z.string(),
  usage_count: z.number(),
});

export const requestSchema = z.object({
  id: z.string(),
  date: z.string(),
  user: z.string(),
  status: z.number(),
  comments: z.string(),
  routes: z.array(routeSchema).optional(),
  driver: z.string().nullable(),
  status_text: z.string(),
});

export const paginatedRequestsSchema = z.object({
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
