import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, X } from "lucide-react";
import axios from "axios";
import debounce from "lodash.debounce";
import Input from "../../ui/Input";

interface NominatimAddress {
  road?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  country?: string;
}

interface NominatimPlace {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address?: NominatimAddress;
}

interface LocationInputsProps {
  departure: { lat: number; lng: number } | undefined | null;
  destination: { lat: number; lng: number } | undefined | null;
  setDeparture: (coords: { lat: number; lng: number } | null) => void;
  setDestination: (coords: { lat: number; lng: number } | null) => void;
  selecting: "departure" | "destination" | null;
  setSelecting: (type: "departure" | "destination" | null) => void;
  register: any;
  errors: any;
  setValue: any;
}

const LocationInputs: React.FC<LocationInputsProps> = ({
  departure,
  destination,
  setDeparture,
  setDestination,
  selecting,
  setSelecting,
  register,
  errors,
  setValue,
}) => {
  const [queries, setQueries] = useState({ departure: "", destination: "" });
  const [suggestions, setSuggestions] = useState<{
    departure: NominatimPlace[];
    destination: NominatimPlace[];
  }>({
    departure: [],
    destination: [],
  });
  const [dropdownsOpen, setDropdownsOpen] = useState({
    departure: false,
    destination: false,
  });
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced функция только для поиска координат
  const debouncedSearchAndSetLocation = useCallback(
    debounce((type: "departure" | "destination", query: string) => {
      searchAndSetLocation(type, query);
    }, 500),
    []
  );

  useEffect(() => {
    if (departure?.lat && departure?.lng) {
      reverseGeocode(departure.lat, departure.lng, "departure");
    }
  }, [departure]);

  useEffect(() => {
    if (destination?.lat && destination?.lng) {
      reverseGeocode(destination.lat, destination.lng, "destination");
    }
  }, [destination]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setDropdownsOpen({ departure: false, destination: false });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const reverseGeocode = async (
    lat: number,
    lng: number,
    type: "departure" | "destination"
  ) => {
    try {
      const { data } = await axios.get<NominatimPlace>(
        "https://nominatim.openstreetmap.org/reverse",
        {
          params: { lat, lon: lng, format: "json", addressdetails: 1 },
        }
      );

      if (data?.display_name) {
        setQueries((q) => ({ ...q, [type]: data.display_name }));
        setValue(type, data.display_name);
      } else {
        const coords = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setQueries((q) => ({ ...q, [type]: coords }));
        setValue(type, coords);
      }
    } catch (error) {
      const coords = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setQueries((q) => ({ ...q, [type]: coords }));
      setValue(type, coords);
    }
  };

  const fetchSuggestions = async (
    type: "departure" | "destination",
    query: string
  ) => {
    if (!query) {
      setSuggestions((s) => ({ ...s, [type]: [] }));
      return;
    }

    try {
      const { data } = await axios.get<NominatimPlace[]>(
        "https://nominatim.openstreetmap.org/search",
        {
          params: { q: query, format: "json", addressdetails: 1, limit: 5 },
        }
      );
      setSuggestions((s) => ({ ...s, [type]: data }));
    } catch (err) {
      console.error("Ошибка при получении подсказок:", err);
    }
  };

  const parseCoordinates = (input: string) => {
    const regex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const match = input.match(regex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  };

  const searchAndSetLocation = async (
    type: "departure" | "destination",
    query: string
  ) => {
    const setter = type === "departure" ? setDeparture : setDestination;

    const coords = parseCoordinates(query);
    if (coords) {
      setter(coords);
      setQueries((q) => ({ ...q, [type]: query }));
      setValue(type, query);
      return;
    }

    try {
      const { data } = await axios.get<NominatimPlace[]>(
        "https://nominatim.openstreetmap.org/search",
        {
          params: { q: query, format: "json", limit: 1, addressdetails: 1 },
        }
      );

      if (data.length > 0) {
        const place = data[0];
        setter({ lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
        setQueries((q) => ({ ...q, [type]: place.display_name }));
        setValue(type, place.display_name);
        console.log(`[SET VALUE from geocode] ${type}:`, place.display_name);
      }
    } catch (err) {
      console.error("Ошибка при поиске местоположения:", err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "departure" | "destination"
  ) => {
    const value = e.target.value;
    console.log(`[INPUT CHANGE] ${type}:`, value);
    setQueries((q) => ({ ...q, [type]: value }));
    setValue(type, value);

    if (value.trim() === "") {
      if (type === "departure") setDeparture(null);
      else setDestination(null);
      setSuggestions((s) => ({ ...s, [type]: [] }));
      setDropdownsOpen((d) => ({ ...d, [type]: false }));
    } else {
      fetchSuggestions(type, value); // Оставляем без debounce для быстрого автодополнения
      debouncedSearchAndSetLocation(type, value); // Обновляем координаты с debounce
      setDropdownsOpen((d) => ({ ...d, [type]: true }));
    }
  };

  const handleClear = (type: "departure" | "destination") => {
    setQueries((q) => ({ ...q, [type]: "" }));
    setValue(type, "");
    if (type === "departure") setDeparture(null);
    else setDestination(null);
    setSuggestions((s) => ({ ...s, [type]: [] }));
    setDropdownsOpen((d) => ({ ...d, [type]: false }));
  };

  const handleSelect = (
    suggestion: NominatimPlace,
    type: "departure" | "destination"
  ) => {
    const setter = type === "departure" ? setDeparture : setDestination;
    setter({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setQueries((q) => ({ ...q, [type]: suggestion.display_name }));
    setValue(type, suggestion.display_name);
    setSuggestions((s) => ({ ...s, [type]: [] }));
    setDropdownsOpen((d) => ({ ...d, [type]: false }));
  };

  const handleKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "departure" | "destination"
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      debouncedSearchAndSetLocation.cancel(); // Отменяем отложенный поиск
      await searchAndSetLocation(type, queries[type]);
      setDropdownsOpen((d) => ({ ...d, [type]: false }));
    }
  };

  const handleBlur = async (type: "departure" | "destination") => {
    setTimeout(async () => {
      if (queries[type] && suggestions[type].length === 0) {
        debouncedSearchAndSetLocation.cancel(); // Отменяем отложенный поиск
        await searchAndSetLocation(type, queries[type]);
      }
      setDropdownsOpen((d) => ({ ...d, [type]: false }));
    }, 100);
  };

  return (
    <div className="flex flex-col gap-2" ref={wrapperRef}>
      {(["departure", "destination"] as const).map((type) => (
        <div key={type} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              placeholder={type === "departure" ? "Откуда" : "Куда"}
              value={queries[type]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange(e, type)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                handleKeyDown(e, type)
              }
              onBlur={() => handleBlur(type)}
              onFocus={() => {
                if (queries[type]) {
                  fetchSuggestions(type, queries[type]);
                  setDropdownsOpen((d) => ({ ...d, [type]: true }));
                } else {
                  setSuggestions((s) => ({ ...s, [type]: [] }));
                  setDropdownsOpen((d) => ({ ...d, [type]: false }));
                }
              }}
              {...register(type)}
            />
            {queries[type] && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => handleClear(type)}
                onMouseDown={(e) => e.preventDefault()}
              >
                <X size={16} />
              </button>
            )}
            {dropdownsOpen[type] && suggestions[type].length > 0 && (
              <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto z-[1000]">
                {suggestions[type].map((s: NominatimPlace) => (
                  <li
                    key={s.place_id}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                    onMouseDown={() => handleSelect(s, type)}
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            className={`p-2 rounded-md border ${
              selecting === type
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-gray-100 border-gray-300"
            }`}
            onClick={() => setSelecting(type)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <MapPin
              size={20}
              className={
                type === "departure" ? "text-blue-600" : "text-red-600"
              }
            />
          </button>
          {errors[type] && errors[type].message && (
            <p className="text-red-500 text-sm mt-1">{errors[type].message}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default LocationInputs;
