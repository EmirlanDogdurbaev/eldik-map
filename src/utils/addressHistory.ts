// src/utils/addressHistory.ts

const HISTORY_KEY = "address_history";

export const saveToHistory = (
  type: "departure" | "destination",
  value: string
) => {
  const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
  const values = stored[type] || [];

  if (!values.includes(value)) {
    const updated = [value, ...values].slice(0, 10); // максимум 10 последних
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify({ ...stored, [type]: updated })
    );
  }
};

export const getHistory = (type: "departure" | "destination"): string[] => {
  const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
  return stored[type] || [];
};
