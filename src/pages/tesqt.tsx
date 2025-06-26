// import React, { useEffect, useState, useRef } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   Polyline,
//   useMap,
// } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

// // Define types
// interface Coordinates {
//   lat: number;
//   lng: number;
// }

// interface UserData {
//   user_id: string;
//   role: "user" | "driver";
//   coordinates: Coordinates;
//   location_text: string;
// }

// interface PairData {
//   driver_id: string;
//   user_id: string;
// }

// type ConnectionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR";

// // WebSocket URL
// const WS_URL = "ws://35.224.163.23/ws/location/";
// const API_URL = "http://35.224.163.23/api/get-pair/";

// // Icons
// const userIcon = L.icon({
//   iconUrl: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
//   iconSize: [30, 30],
//   iconAnchor: [15, 15],
//   popupAnchor: [0, -15],
// });

// const driverIcon = L.icon({
//   iconUrl: "https://cdn-icons-png.flaticon.com/512/167/167723.png", // Проверенная иконка
//   iconSize: [30, 30],
//   iconAnchor: [15, 15],
//   popupAnchor: [0, -15],
// });

// export const Test: React.FC = () => {
//   const [users, setUsers] = useState<{ [user_id: string]: UserData }>({});
//   const [paths, setPaths] = useState<{ [user_id: string]: Coordinates[] }>({});
//   const [connectionStatus, setConnectionStatus] =
//     useState<ConnectionStatus>("CONNECTING");
//   const [error, setError] = useState<string | null>(null);
//   const [isTracking, setIsTracking] = useState<boolean>(false);
//   const wsRef = useRef<WebSocket | null>(null);
//   const markerRefs = useRef<{ [user_id: string]: L.Marker }>({});
//   const watchIdRef = useRef<number | null>(null);
//   const reconnectAttempts = useRef<number>(0);
//   const maxReconnectAttempts = 5;
//   const reconnectInterval = 3000;
//   const animationDuration = 500;
//   const animationSteps = 40;
//   // Кешируем адреса по координатам
//   const reverseCache = useRef<Map<string, string>>(new Map());

//   const [userId, setUserId] = useState<string>(
//     localStorage.getItem("user_id") || "default_user"
//   );
//   const [role, setRole] = useState<"user" | "driver">(
//     (localStorage.getItem("role") as "user" | "driver") || "user"
//   );
//   const [driverId, setDriverId] = useState<string>("");

//   const RecenterMap: React.FC<{ position: Coordinates }> = ({ position }) => {
//     const map = useMap();
//     useEffect(() => {
//       map.setView([position.lat, position.lng], 15, {
//         animate: true,
//         duration: 1,
//       });
//     }, [position, map]);
//     return null;
//   };

//   // Interpolate between two coordinates
//   const interpolate = (
//     start: Coordinates,
//     end: Coordinates,
//     fraction: number
//   ): Coordinates => {
//     return {
//       lat: start.lat + (end.lat - start.lat) * fraction,
//       lng: start.lng + (end.lng - start.lng) * fraction,
//     };
//   };

//   const animateMarker = (
//     user_id: string,
//     start: Coordinates,
//     end: Coordinates
//   ) => {
//     let step = 0;
//     const interval = setInterval(() => {
//       step += 1;
//       const fraction = Math.min(step / animationSteps, 1);
//       const newPos = interpolate(start, end, fraction);

//       // Обновляем только координаты внутри setUsers
//       setUsers((prev) => ({
//         ...prev,
//         [user_id]: {
//           ...prev[user_id],
//           coordinates: newPos,
//         },
//       }));

//       // Если маркер существует — двигаем напрямую (оптимизация)
//       if (markerRefs.current[user_id]) {
//         markerRefs.current[user_id].setLatLng([newPos.lat, newPos.lng]);
//       }

//       if (fraction === 1) {
//         clearInterval(interval);
//       }
//     }, animationDuration / animationSteps);
//   };

//   const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
//     const key = `${lat.toFixed(5)},${lon.toFixed(5)}`; // округляем для снижения количества вариантов
//     const cache = reverseCache.current;

//     if (cache.has(key)) {
//       return cache.get(key)!;
//     }

//     try {
//       const resp = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
//       );
//       if (!resp.ok) throw new Error("Ошибка запроса");
//       const data = await resp.json();
//       const address = data.display_name || "Address not found";
//       cache.set(key, address); // Кладём в кеш
//       return address;
//     } catch {
//       return "Address not found";
//     }
//   };

//   const getPairId = async (
//     user_id: string,
//     role: string
//   ): Promise<PairData> => {
//     try {
//       const response = await fetch(
//         `${API_URL}?user_id=${encodeURIComponent(
//           user_id
//         )}&role=${encodeURIComponent(role)}`
//       );
//       if (!response.ok)
//         throw new Error(`HTTP error! status: ${response.status}`);
//       return await response.json();
//     } catch (error) {
//       console.error("Ошибка при получении пары:", error);
//       throw error;
//     }
//   };

//   const lastSentRef = useRef<number>(0);

//   const sendLocation = async (lat: number, lng: number) => {
//     if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
//       setError("WebSocket not connected");
//       return;
//     }

//     try {
//       const now = Date.now();
//       if (now - lastSentRef.current < 5000) return; // максимум раз в 5 сек
//       lastSentRef.current = now;

//       const response = await reverseGeocode(lat, lng);
//       const address = response || "Address not found";
//       console.log("Sending location:", lat, lng);

//       const sendData = {
//         user_id: userId,
//         driver_id: driverId,
//         role,
//         coordinates: [lat.toString(), lng.toString()],
//         location_text: address,
//       };
//       wsRef.current.send(JSON.stringify(sendData));
//     } catch (err) {
//       console.error("Geocoding error:", err);
//       const fallbackData = {
//         user_id: userId,
//         driver_id: driverId,
//         role,
//         coordinates: [lat.toString(), lng.toString()],
//         location_text: "Address not found",
//       };
//       wsRef.current.send(JSON.stringify(fallbackData));
//     }
//   };

//   const startTracking = () => {
//     if (!navigator.geolocation) {
//       setError("Geolocation not supported");
//       return;
//     }

//     if (watchIdRef.current !== null) return;

//     watchIdRef.current = navigator.geolocation.watchPosition(
//       (pos) => {
//         const { latitude, longitude } = pos.coords;
//         sendLocation(latitude, longitude);
//       },
//       (err) => {
//         setError(`Geolocation error: ${err.message}`);
//       },
//       {
//         enableHighAccuracy: true,
//         maximumAge: 0,
//         timeout: 1000,
//       }
//     );
//     setIsTracking(true);
//   };

//   const stopTracking = () => {
//     if (watchIdRef.current !== null) {
//       navigator.geolocation.clearWatch(watchIdRef.current);
//       watchIdRef.current = null;
//       setIsTracking(false);
//     }
//   };

//   const connectWebSocket = async () => {
//     try {
//       const pair = await getPairId(userId, role);
//       setDriverId(pair.driver_id);

//       const wsUrl = `${WS_URL}?user_id=${encodeURIComponent(
//         userId
//       )}&driver_id=${encodeURIComponent(
//         pair.driver_id
//       )}&role=${encodeURIComponent(role)}`;
//       const websocket = new WebSocket(wsUrl);
//       wsRef.current = websocket;
//       console.log("✅ WebSocket открыт для:", userId, role);

//       websocket.onopen = () => {
//         console.log("WebSocket connected to:", wsUrl);
//         setConnectionStatus("CONNECTED");
//         setError(null);
//         reconnectAttempts.current = 0;
//         startTracking();
//       };

//       websocket.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
//           const { user_id, role, coordinates, location_text } = data;

//           if (!Array.isArray(coordinates) || coordinates.length !== 2) {
//             throw new Error("Invalid coordinates format");
//           }
//           console.log("WS incoming data:", data);

//           const lat = parseFloat(coordinates[0]);
//           const lng = parseFloat(coordinates[1]);
//           if (isNaN(lat) || isNaN(lng)) {
//             throw new Error("Invalid coordinate values");
//           }

//           const newPos: Coordinates = { lat, lng };
//           setUsers((prev) => {
//             const prevPos = prev[user_id]?.coordinates || newPos;
//             if (prev[user_id]) {
//               animateMarker(user_id, prevPos, newPos);
//             }
//             return {
//               ...prev,
//               [user_id]: {
//                 user_id,
//                 role,
//                 coordinates: newPos, // ← фикс
//                 location_text,
//               },
//             };
//           });

//           setPaths((prev) => ({
//             ...prev,
//             [user_id]: [...(prev[user_id] || []), newPos].slice(-100),
//           }));
//         } catch (err) {
//           console.error("Error parsing WebSocket message:", err);
//           setError("Invalid data received");
//         }
//       };

//       websocket.onclose = () => {
//         setConnectionStatus("DISCONNECTED");
//         stopTracking();
//         attemptReconnect();
//       };

//       websocket.onerror = () => {
//         setConnectionStatus("ERROR");
//         setError("Connection failed");
//         stopTracking();
//         attemptReconnect();
//         console.error("❌ WebSocket ошибка:", userId, role);
//       };
//     } catch (err) {
//       console.error("Error connecting WebSocket:", err);
//       setError("Не удалось получить пару");
//       attemptReconnect();
//     }
//   };

//   const attemptReconnect = () => {
//     if (reconnectAttempts.current < maxReconnectAttempts) {
//       reconnectAttempts.current += 1;
//       setTimeout(() => {
//         console.log(`Reconnecting... Attempt ${reconnectAttempts.current}`);
//         setConnectionStatus("CONNECTING");
//         connectWebSocket();
//       }, reconnectInterval);
//     } else {
//       setError("Max reconnection attempts reached. Please refresh.");
//     }
//   };

//   useEffect(() => {
//     const storedUserId = localStorage.getItem("user_id");
//     const storedRole = localStorage.getItem("role") as "user" | "driver";
//     if (storedUserId) setUserId(storedUserId);
//     if (storedRole) setRole(storedRole);

//     connectWebSocket();
//     return () => {
//       if (wsRef.current) {
//         wsRef.current.close();
//       }
//       stopTracking();
//     };
//   }, []);

//   const latestPosition = Object.values(users)[0]?.coordinates || {
//     lat: 42.8746,
//     lng: 74.6122,
//   };

//   return (
//     <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
//       <div
//         style={{
//           position: "absolute",
//           top: "1rem",
//           left: "1rem",
//           zIndex: 1000,
//           background: "white",
//           padding: "1rem",
//           borderRadius: "0.25rem",
//           boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
//         }}
//       >
//         <p style={{ fontSize: "0.875rem", fontWeight: "600" }}>
//           Status: {connectionStatus}
//         </p>
//         {error && <p style={{ color: "red", fontSize: "0.875rem" }}>{error}</p>}
//         <button
//           style={{
//             marginTop: "0.5rem",
//             padding: "0.5rem",
//             background: isTracking ? "red" : "blue",
//             color: "white",
//             borderRadius: "0.25rem",
//           }}
//           onClick={isTracking ? stopTracking : startTracking}
//         >
//           {isTracking ? "⏹ Stop Tracking" : "▶️ Start Tracking"}
//         </button>
//       </div>

//       <MapContainer
//         center={[42.8746, 74.6122]}
//         zoom={13}
//         style={{ height: "100%", width: "100%" }}
//       >
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         />
//         {Object.entries(users).map(([user_id, user]) => (
//           <React.Fragment key={user_id}>
//             <Marker
//               ref={(ref) => {
//                 if (ref) markerRefs.current[user_id] = ref;
//               }}
//               position={[user.coordinates.lat, user.coordinates.lng]}
//               icon={user.role === "driver" ? driverIcon : userIcon}
//             >
//               <Popup>{`${user.role}: ${user_id}<br>${user.location_text}`}</Popup>
//             </Marker>
//             {paths[user_id] && (
//               <Polyline
//                 positions={paths[user_id].map((p) => [p.lat, p.lng])}
//                 color={user.role === "driver" ? "blue" : "green"}
//                 weight={3}
//                 opacity={0.7}
//               />
//             )}
//           </React.Fragment>
//         ))}
//         <RecenterMap position={latestPosition} />
//       </MapContainer>
//     </div>
//   );
// };
