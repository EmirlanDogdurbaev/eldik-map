export interface Route {
  goal: string;
  departure: string;
  destination: string;
  request: string;
  time: string;
  usage_count: number;
  id: string;
}

export interface Request {
  id: string;
  date: string;
  user: string;
  status: number;
  comments: string;
  routes: Route[];
  driver: string | null;
  status_text: string;
}

export interface RequestsResponse {
  requests: Request[];
  totalPages: number;
}

export interface FilterField {
  type: "text" | "select";
  key: string;
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}
