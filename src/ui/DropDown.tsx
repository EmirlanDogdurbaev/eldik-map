import React from "react";

interface HistoryDropdownProps {
  items: string[];
  onSelect: (value: string) => void;
}

const HistoryDropdown: React.FC<HistoryDropdownProps> = ({
  items,
  onSelect,
}) => {
  if (!items.length) return null;

  return (
    <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto z-[1000]">
      {items.map((item) => (
        <li
          key={item}
          className="px-3 py-2 cursor-pointer hover:bg-gray-100"
          onMouseDown={() => onSelect(item)}
        >
          {item}
        </li>
      ))}
    </ul>
  );
};

export default HistoryDropdown;
