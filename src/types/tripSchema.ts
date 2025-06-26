export interface TripFormData {
  date: string;
  time: string;
  goal: string;
  departure: string;
  destination: string;
}

export interface TripRequest {
  date: string;
  user: string;
  request_id?: string; // Optional for user, required for driver
  routes: {
    goal: string;
    departure: string;
    destination: string;
    time: string;
  }[];
}

export interface TripResponse {
  id: string;
  date: string;
  user: string;
  routes: {
    goal: string;
    departure: string;
    destination: string;
    time: string;
  }[];
}

export interface RouteItem {
  id?: string;
  request_id?: string; // Optional for user, required for driver
  goal: string;
  departure: string;
  destination: string;
  time: string;
  departure_coordinates?: [string, string];
  destination_coordinates?: [string, string];
  transport_type?: string;
  travel_date?: string;
  start_time?: string;
  end_time?: string;
}
