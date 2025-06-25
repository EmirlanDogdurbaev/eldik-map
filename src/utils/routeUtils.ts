import type { RouteItem } from "../types/tripSchema";

export function extractCleanRoute(
  oldRoute: RouteItem,
  overrides: Partial<RouteItem>
): RouteItem {
  return {
    goal: overrides.goal ?? oldRoute.goal,
    departure: oldRoute.departure,
    destination: oldRoute.destination,
    time: overrides.time ?? oldRoute.time,
    departure_coordinates: oldRoute.departure_coordinates,
    destination_coordinates: oldRoute.destination_coordinates,
    travel_date: oldRoute.travel_date,
    transport_type: oldRoute.transport_type,
  };
}
