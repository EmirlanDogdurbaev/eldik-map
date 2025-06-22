import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, X } from "lucide-react";
import axios from "axios";
import debounce from "lodash.debounce";
import { Controller } from "react-hook-form";
import Input from "../../ui/Input";
import HistoryDropdown from "../../ui/DropDown";
import Button from "../../ui/Button";
import { getHistory, saveToHistory } from "../../utils/addressHistory";

// ====== Интерфейсы ======
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
  clearTrigger: number;
  errors: any;
  setValue: any;
  control: any;
}

// ====== Геофильтр для Кыргызстана ======
const BBOX = { minLat: 39, maxLat: 43.3, minLng: 69, maxLng: 80.3 };
function isWithinKyrgyzstan(lat: number, lng: number) {
  return (
    lat >= BBOX.minLat &&
    lat <= BBOX.maxLat &&
    lng >= BBOX.minLng &&
    lng <= BBOX.maxLng
  );
}

function parseCoordinates(input: string) {
  const regex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
  const match = input.match(regex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[3]);
    if (isWithinKyrgyzstan(lat, lng)) return { lat, lng };
  }
  return null;
}

// ====== Основной компонент ======
const LocationInputs: React.FC<LocationInputsProps> = ({
  departure,
  destination,
  setDeparture,
  setDestination,
  selecting,
  setSelecting,
  errors,
  setValue,
  clearTrigger,
  control,
}) => {
  const [queries, setQueries] = useState<{
    departure: string;
    destination: string;
  }>({
    departure: "",
    destination: "",
  });
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
  const [history, setHistory] = useState<{
    departure: string[];
    destination: string[];
  }>({
    departure: [],
    destination: [],
  });
  const wrapperRef = useRef<HTMLDivElement>(null);

  // debounced fetchSuggestions
  const debouncedFetchSuggestions = useCallback(
    debounce((type: "departure" | "destination", query: string) => {
      fetchSuggestions(type, query);
    }, 600),
    []
  );

  useEffect(() => {
    setHistory({
      departure: getHistory("departure"),
      destination: getHistory("destination"),
    });
  }, []);

  useEffect(() => {
    setQueries({ departure: "", destination: "" });
    setSuggestions({ departure: [], destination: [] });
  }, [clearTrigger]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setDropdownsOpen({ departure: false, destination: false });
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAddress = async () => {
      if (departure?.lat && departure?.lng) {
        try {
          const { data } = await axios.get(
            "https://nominatim.openstreetmap.org/reverse",
            {
              params: {
                lat: departure.lat,
                lon: departure.lng,
                format: "json",
                addressdetails: 1,
                countrycodes: "kg",
              },
            }
          );
          const result = data as NominatimPlace;
          if (result.display_name) {
            setQueries((q) => ({ ...q, departure: result.display_name }));
            setValue("departure", result.display_name);
          } else {
            const coords = `${departure.lat.toFixed(
              4
            )}, ${departure.lng.toFixed(4)}`;
            setQueries((q) => ({ ...q, departure: coords }));
            setValue("departure", coords);
          }
        } catch {
          const coords = `${departure.lat.toFixed(4)}, ${departure.lng.toFixed(
            4
          )}`;
          setQueries((q) => ({ ...q, departure: coords }));
          setValue("departure", coords);
        }
      }
    };
    fetchAddress();
    // eslint-disable-next-line
  }, [departure]);

  useEffect(() => {
    const fetchAddress = async () => {
      if (destination?.lat && destination?.lng) {
        try {
          const { data } = await axios.get(
            "https://nominatim.openstreetmap.org/reverse",
            {
              params: {
                lat: destination.lat,
                lon: destination.lng,
                format: "json",
                addressdetails: 1,
                countrycodes: "kg",
              },
            }
          );
          const result = data as NominatimPlace;
          if (result.display_name) {
            setQueries((q) => ({ ...q, destination: result.display_name }));
            setValue("destination", result.display_name);
          } else {
            const coords = `${destination.lat.toFixed(
              4
            )}, ${destination.lng.toFixed(4)}`;
            setQueries((q) => ({ ...q, destination: coords }));
            setValue("destination", coords);
          }
        } catch {
          const coords = `${destination.lat.toFixed(
            4
          )}, ${destination.lng.toFixed(4)}`;
          setQueries((q) => ({ ...q, destination: coords }));
          setValue("destination", coords);
        }
      }
    };
    fetchAddress();
    // eslint-disable-next-line
  }, [destination]);

  // ======= Fetch подсказок только по Кыргызстану =======
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
          params: {
            q: query,
            format: "json",
            addressdetails: 1,
            limit: 5,
            countrycodes: "kg",
          },
        }
      );
      setSuggestions((s) => ({ ...s, [type]: data }));
    } catch {
      setSuggestions((s) => ({ ...s, [type]: [] }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "departure" | "destination"
  ) => {
    const value = e.target.value;
    setQueries((q) => ({ ...q, [type]: value }));
    setValue(type, value);

    if (!value.trim()) {
      if (type === "departure") setDeparture(null);
      else setDestination(null);
      setSuggestions((s) => ({ ...s, [type]: [] }));
      setDropdownsOpen((d) => ({ ...d, [type]: false }));
      return;
    }

    debouncedFetchSuggestions(type, value);
    setDropdownsOpen((d) => ({ ...d, [type]: true }));
  };

  const handleSelect = (
    suggestion: NominatimPlace,
    type: "departure" | "destination"
  ) => {
    const setter = type === "departure" ? setDeparture : setDestination;
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    if (!isWithinKyrgyzstan(lat, lng)) {
      alert("Адрес вне территории Кыргызстана!");
      return;
    }

    setter({ lat, lng });
    setQueries((q) => ({ ...q, [type]: suggestion.display_name }));
    setValue(type, suggestion.display_name);
    setSuggestions((s) => ({ ...s, [type]: [] }));
    setDropdownsOpen((d) => ({ ...d, [type]: false }));
    saveToHistory(type, suggestion.display_name);
  };

  const handleKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "departure" | "destination"
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      debouncedFetchSuggestions.cancel();
      // пробуем распарсить как координаты
      const coords = parseCoordinates(queries[type]);
      if (coords) {
        if (!isWithinKyrgyzstan(coords.lat, coords.lng)) {
          alert("Точка вне территории Кыргызстана!");
          return;
        }
        (type === "departure" ? setDeparture : setDestination)(coords);
        setValue(type, queries[type]);
        setDropdownsOpen((d) => ({ ...d, [type]: false }));
        return;
      }

      // иначе ищем по адресу (только по Кыргызстану)
      try {
        const { data } = await axios.get<NominatimPlace[]>(
          "https://nominatim.openstreetmap.org/search",
          {
            params: {
              q: queries[type],
              format: "json",
              addressdetails: 1,
              limit: 1,
              countrycodes: "kg",
            },
          }
        );
        if (data.length) {
          handleSelect(data[0], type);
        } else {
          alert("Адрес не найден в Кыргызстане");
        }
      } catch {
        alert("Ошибка поиска адреса");
      }
    }
  };

  const handleBlur = (type: "departure" | "destination") => {
    setTimeout(() => {
      setDropdownsOpen((d) => ({ ...d, [type]: false }));
    }, 120);
  };

  const handleClear = (type: "departure" | "destination") => {
    setQueries((q) => ({ ...q, [type]: "" }));
    setValue(type, "");
    if (type === "departure") setDeparture(null);
    else setDestination(null);
    setSuggestions((s) => ({ ...s, [type]: [] }));
    setDropdownsOpen((d) => ({ ...d, [type]: false }));
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Геолокация не поддерживается браузером");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isWithinKyrgyzstan(latitude, longitude)) {
          alert("Вы вне Кыргызстана");
          return;
        }
        setDeparture({ lat: latitude, lng: longitude });
      },
      () => alert("Не удалось получить местоположение")
    );
  };

  return (
    <div className="flex flex-col gap-2" ref={wrapperRef}>
      <Button
        type="button"
        onClick={handleMyLocation}
        className="mb-2 bg-blue-500 text-white hover:bg-blue-600 p-2 rounded-md flex items-center gap-2 cursor-pointer"
      >
        Моё местоположение
      </Button>
      {(["departure", "destination"] as const).map((type) => (
        <div key={type} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Controller
              name={type}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={type === "departure" ? "Откуда" : "Куда"}
                  value={queries[type]}
                  onChange={(e) => {
                    setQueries((q) => ({ ...q, [type]: e.target.value }));
                    field.onChange(e);
                    handleInputChange(e, type);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, type)}
                  onBlur={() => handleBlur(type)}
                  onFocus={() =>
                    setDropdownsOpen((d) => ({ ...d, [type]: !!queries[type] }))
                  }
                />
              )}
            />
            {queries[type] && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => handleClear(type)}
                onMouseDown={(e) => e.preventDefault()}
              >
                <X size={16} />
              </button>
            )}
            {dropdownsOpen[type] && (
              <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto z-[1000]">
                {suggestions[type].length > 0 ? (
                  suggestions[type].map((s: NominatimPlace) => (
                    <li
                      key={s.place_id}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSelect(s, type)}
                    >
                      {s.display_name}
                    </li>
                  ))
                ) : (
                  <HistoryDropdown
                    items={history[type]}
                    onSelect={(value) => {
                      setQueries((q) => ({ ...q, [type]: value }));
                      setValue(type, value);
                      setDropdownsOpen((d) => ({ ...d, [type]: false }));
                    }}
                  />
                )}
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
