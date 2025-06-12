import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import Sidebar from "../components/Sidebar/Sidebar";

interface MapEffectProps {
  departure: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  setDeparture: (coords: { lat: number; lng: number } | null) => void;
  setDestination: (coords: { lat: number; lng: number } | null) => void;
  selecting: "departure" | "destination" | null;
  setSelecting: (type: "departure" | "destination" | null) => void;
}

const MapEffect: React.FC<MapEffectProps> = ({
  departure,
  destination,
  setDeparture,
  setDestination,
  selecting,
  setSelecting,
}) => {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    map.setView([42.87, 74.66], 13);
  }, [map]);

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (selecting === "departure") {
        setDeparture({ lat, lng });
        setSelecting(null);
      } else if (selecting === "destination") {
        setDestination({ lat, lng });
        setSelecting(null);
      }
    };

    if (selecting) {
      map.on("click", handleClick);
    }

    return () => {
      map.off("click", handleClick);
    };
  }, [map, selecting, setDeparture, setDestination, setSelecting]);

  useEffect(() => {
    if (!departure || !destination) {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      return;
    }

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(departure.lat, departure.lng),
        L.latLng(destination.lat, destination.lng),
      ],
      routeWhileDragging: false,
      lineOptions: {
        styles: [{ color: "#007bff", weight: 4 }],
        extendToWaypoints: false,
        missingRouteTolerance: 0,
      },
      show: false,
      addWaypoints: false,
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
    }).addTo(map);

    routingControlRef.current = routingControl;

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map, departure, destination]);

  const handleDepartureDragEnd = (e: L.LeafletEvent) => {
    const { lat, lng } = e.target.getLatLng();
    setDeparture({ lat, lng });
  };

  const handleDestinationDragEnd = (e: L.LeafletEvent) => {
    const { lat, lng } = e.target.getLatLng();
    setDestination({ lat, lng });
  };

  return (
    <>
      {departure && (
        <Marker
          position={[departure.lat, departure.lng]}
          draggable={true}
          eventHandlers={{ dragend: handleDepartureDragEnd }}
        >
          <Popup>Точка отправления</Popup>
        </Marker>
      )}
      {destination && (
        <Marker
          position={[destination.lat, destination.lng]}
          draggable={true}
          eventHandlers={{ dragend: handleDestinationDragEnd }}
        >
          <Popup>Точка назначения</Popup>
        </Marker>
      )}
    </>
  );
};

const MapPage: React.FC = () => {
  const [points, setPoints] = useState<{
    departure: { lat: number; lng: number } | null;
    destination: { lat: number; lng: number } | null;
  }>({ departure: null, destination: null });
  const [selecting, setSelecting] = useState<
    "departure" | "destination" | null
  >(null);

  const setDeparture = (coords: { lat: number; lng: number } | null) => {
    setPoints((prev) => ({ ...prev, departure: coords }));
  };

  const setDestination = (coords: { lat: number; lng: number } | null) => {
    setPoints((prev) => ({ ...prev, destination: coords }));
  };

  return (
    <div className="flex h-screen w-[100vw]">
      <Sidebar
        className="flex-shrink-0"
        departure={points.departure}
        destination={points.destination}
        setDeparture={setDeparture}
        setDestination={setDestination}
        selecting={selecting}
        setSelecting={setSelecting}
      />
      <MapContainer
        style={{ height: "100%", minWidth: "100%" }}
        zoom={13}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEffect
          departure={points.departure}
          destination={points.destination}
          setDeparture={setDeparture}
          setDestination={setDestination}
          selecting={selecting}
          setSelecting={setSelecting}
        />
      </MapContainer>
    </div>
  );
};

export default MapPage;
