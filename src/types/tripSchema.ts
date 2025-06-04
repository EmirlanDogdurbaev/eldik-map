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
