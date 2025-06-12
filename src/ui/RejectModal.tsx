import React, { useState } from "react";
import Button from "../ui/Button";

interface RejectModalProps {
  comment: string;
  onChange: (value: string) => void;
  onConfirm: (reason: string) => void; // Изменили на функцию с параметром
  onCancel: () => void;
  isLoading: boolean;
}

const RejectModal: React.FC<RejectModalProps> = ({
  comment,
  onChange,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  const [localReason, setLocalReason] = useState(comment);

  console.log("RejectModal rendered with reason:", localReason);

  const handleConfirm = () => {
    if (!localReason.trim()) {
      alert("Пожалуйста, укажите причину отказа");
      return;
    }
    console.log("Sending comment to parent:", localReason);
    onChange(localReason); // Обновляем состояние в родителе
    onConfirm(localReason); // Передаём значение напрямую
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Причина отказа</h3>
        <textarea
          value={localReason}
          onChange={(e) => setLocalReason(e.target.value)}
          placeholder="Укажите причину отказа"
          className="w-full p-2 border rounded mb-4"
          required
        />
        <div className="flex justify-end space-x-2">
          <Button
            onClick={handleConfirm}
            className="bg-red-500 hover:bg-red-600 py-2 px-4 text-white"
            disabled={isLoading || !localReason.trim()}
          >
            {isLoading ? "Загрузка..." : "Подтвердить"}
          </Button>
          <Button
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-600 py-2 px-4 text-white"
            disabled={isLoading}
          >
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;
