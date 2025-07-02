import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Define types
interface Coordinates {
  lat: number;
  lng: number;
}

interface UserData {
  user_id: string;
  role: "user" | "driver" | "dispetcher";
  coordinates: Coordinates;
  location_text: string;
}

interface PairData {
  driver_id: string;
  user_id: string;
}

type ConnectionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR";

const WS_URL = `${import.meta.env.VITE_WS_URL}/location/`;
const API_URL = `${import.meta.env.VITE_API_URL}/get-pair/`;

// Icons
const userIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

const driverIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/167/167723.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

export const Test: React.FC = () => {
  const [users, setUsers] = useState<{ [user_id: string]: UserData }>({});
  const [paths, setPaths] = useState<{ [user_id: string]: Coordinates[] }>({});
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("CONNECTING");
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const markerRefs = useRef<{ [user_id: string]: L.Marker }>({});
  const watchIdRef = useRef<number | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000;
  const animationDuration = 500;
  const animationSteps = 40;

  const reverseCache = useRef<Map<string, string>>(new Map());
  const [userId, setUserId] = useState<string>(
    localStorage.getItem("user_id") || "default_user"
  );
  const [role, setRole] = useState<"user" | "driver" | "dispetcher">(
    (localStorage.getItem("role") as "user" | "driver" | "dispetcher") || "user"
  );
  const [driverId, setDriverId] = useState<string>("");

  const RecenterMap: React.FC<{ position: Coordinates }> = ({ position }) => {
    const map = useMap();
    useEffect(() => {
      map.setView([position.lat, position.lng], 15, {
        animate: true,
        duration: 1,
      });
    }, [position, map]);
    return null;
  };

  const interpolate = (
    start: Coordinates,
    end: Coordinates,
    fraction: number
  ): Coordinates => ({
    lat: start.lat + (end.lat - start.lat) * fraction,
    lng: start.lng + (end.lng - start.lng) * fraction,
  });

  const animateMarker = (
    user_id: string,
    start: Coordinates,
    end: Coordinates
  ) => {
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      const fraction = Math.min(step / animationSteps, 1);
      const newPos = interpolate(start, end, fraction);
      setUsers((prev) => ({
        ...prev,
        [user_id]: { ...prev[user_id], coordinates: newPos },
      }));
      if (markerRefs.current[user_id]) {
        markerRefs.current[user_id].setLatLng([newPos.lat, newPos.lng]);
      }
      if (fraction === 1) clearInterval(interval);
    }, animationDuration / animationSteps);
  };

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
    const cache = reverseCache.current;
    if (cache.has(key)) return cache.get(key)!;
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      if (!resp.ok) throw new Error("Geocoding failed");
      const data = await resp.json();
      const address = data.display_name || "Address not found";
      cache.set(key, address);
      return address;
    } catch {
      return "Address not found";
    }
  };

  const getPairId = async (
    user_id: string,
    role: string
  ): Promise<PairData> => {
    const response = await fetch(
      `${API_URL}?user_id=${encodeURIComponent(
        user_id
      )}&role=${encodeURIComponent(role)}`
    );
    if (!response.ok) throw new Error("Pair fetch failed");
    return await response.json();
  };

  const lastSentRef = useRef<number>(0);

  const sendLocation = async (lat: number, lng: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("WebSocket not Saving...");
      return;
    }
    const now = Date.now();
    if (now - lastSentRef.current < 5000) return;
    lastSentRef.current = now;

    const address = await reverseGeocode(lat, lng);

    const payload = {
      user_id: userId,
      driver_id: driverId,
      role,
      coordinates: [lat, lng],
      location_text: address,
    };

    wsRef.current.send(JSON.stringify(payload));

    // Only update users state for non-dispetcher roles
    if (role !== "dispetcher") {
      setUsers((prev) => ({
        ...prev,
        [userId]: {
          user_id: userId,
          role,
          coordinates: { lat, lng },
          location_text: address,
        },
      }));
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log("📍 New position from geolocation:", latitude, longitude);
        sendLocation(latitude, longitude);
      },
      (err) => {
        setError(`Geolocation error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 1000,
      }
    );
    setIsTracking(true);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
    }
  };

  const connectWebSocket = async () => {
    try {
      let resolvedDriverId = "";
      // Skip pair fetching for dispetcher
      if (role !== "dispetcher") {
        const pair = await getPairId(userId, role);
        console.log("🔗 getPair result:", pair);
        resolvedDriverId = pair.driver_id;
        setDriverId(resolvedDriverId);
      }

      const wsUrl = `${WS_URL}?user_id=${encodeURIComponent(
        userId
      )}&role=${encodeURIComponent(role)}`;

      const websocket = new WebSocket(wsUrl);
      wsRef.current = websocket;

      websocket.onopen = () => {
        console.log("✅ WebSocket connected to:", wsUrl);
        setConnectionStatus("CONNECTED");
        setError(null);
        reconnectAttempts.current = 0;
        if (role !== "dispetcher") startTracking();
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📨 Received from:", data.user_id, "| You are:", userId);

          const { user_id, role: userRole, coordinates, location_text } = data;
          if (!Array.isArray(coordinates) || coordinates.length !== 2) {
            throw new Error("Invalid coordinates");
          }
          const lat = parseFloat(coordinates[0]);
          const lng = parseFloat(coordinates[1]);
          if (isNaN(lat) || isNaN(lng)) throw new Error("NaN coordinates");

          const newPos: Coordinates = { lat, lng };

          // Only update state for non-dispetcher roles
          if (userRole !== "dispetcher") {
            setUsers((prev) => {
              const prevPos = prev[user_id]?.coordinates || newPos;
              if (prev[user_id]) animateMarker(user_id, prevPos, newPos);
              return {
                ...prev,
                [user_id]: {
                  user_id,
                  role: userRole,
                  coordinates: newPos,
                  location_text,
                },
              };
            });

            setPaths((prev) => ({
              ...prev,
              [user_id]: [...(prev[user_id] || []), newPos].slice(-100),
            }));
          }
        } catch (err) {
          console.error("❌ WebSocket message parse error:", err);
          setError("Invalid WebSocket data");
        }
      };

      websocket.onclose = (e) => {
        console.warn("❗️ WebSocket closed", e);
        setConnectionStatus("DISCONNECTED");
        stopTracking();
        attemptReconnect();
      };

      websocket.onerror = (e) => {
        console.error("❌ WebSocket error", e);
        setConnectionStatus("ERROR");
        setError("WebSocket error");
        stopTracking();
        attemptReconnect();
      };
    } catch (err) {
      console.error("❌ Connection failed:", err);
      setError("Failed to connect WebSocket");
      attemptReconnect();
    }
  };

  const attemptReconnect = () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current += 1;
      console.log(
        `🔄 Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`
      );
      setTimeout(() => {
        setConnectionStatus("CONNECTING");
        connectWebSocket();
      }, reconnectInterval * Math.pow(2, reconnectAttempts.current));
    } else {
      setError("Max reconnection attempts reached. Please refresh the page.");
      setConnectionStatus("DISCONNECTED");
    }
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    const storedRole = localStorage.getItem("role") as
      | "user"
      | "driver"
      | "dispetcher";
    if (storedUserId) setUserId(storedUserId);
    if (storedRole) setRole(storedRole);
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      stopTracking();
    };
  }, []);

  const latestPosition = Object.values(users)[0]?.coordinates || {
    lat: 42.8746,
    lng: 74.6122,
  };

  useEffect(() => {
    console.log("📌 All users state:", users);
    console.log("📌 Marker refs:", markerRefs.current);
  }, [users]);

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      {role === "dispetcher" ? (
        <div
          style={{
            display: "none",
            position: "absolute",
            top: "1rem",
            left: "1rem",
            zIndex: 1000,
            background: "white",
            padding: "1rem",
            borderRadius: "0.25rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          <p>Status: {connectionStatus}</p>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button
            onClick={isTracking ? stopTracking : startTracking}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem",
              background: isTracking ? "red" : "blue",
              color: "white",
              borderRadius: "0.25rem",
            }}
          >
            {isTracking ? "⏹️ Stop Tracking" : "▶️ Start Tracking"}
          </button>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            zIndex: 1000,
            background: "white",
            padding: "1rem",
            borderRadius: "0.25rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          <p>Status: {connectionStatus}</p>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button
            onClick={isTracking ? stopTracking : startTracking}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem",
              background: isTracking ? "red" : "blue",
              color: "white",
              borderRadius: "0.25rem",
            }}
          >
            {isTracking ? "⏹️ Stop Tracking" : "▶️ Start Tracking"}
          </button>
        </div>
      )}

      <MapContainer
        center={[42.8746, 74.6122]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className={"z-10"}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {Object.entries(users)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([_, user]) => user.role !== "dispetcher")
          .map(([user_id, user]) => (
            <React.Fragment key={user_id}>
              <Marker
                ref={(ref) => {
                  if (ref) markerRefs.current[user_id] = ref;
                }}
                position={[user.coordinates.lat, user.coordinates.lng]}
                icon={user.role === "driver" ? driverIcon : userIcon}
              >
                <Popup>
                  {user.role}: {user.user_id}
                  <br />
                  {user.location_text}
                </Popup>
              </Marker>
              {paths[user_id] && (
                <Polyline
                  positions={paths[user_id].map((p) => [p.lat, p.lng])}
                  color={user.role === "driver" ? "blue" : "green"}
                />
              )}
            </React.Fragment>
          ))}
        <RecenterMap position={latestPosition} />
      </MapContainer>
    </div>
  );
};
