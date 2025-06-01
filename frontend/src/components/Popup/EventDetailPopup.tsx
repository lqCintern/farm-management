import React from "react";
import { FarmActivity } from "@/types/labor/types";
import "@/styles/popup.css";

interface EventDetailPopupProps {
  event: FarmActivity | null;
  onClose: () => void;
}

const EventDetailPopup: React.FC<EventDetailPopupProps> = ({
  event,
  onClose,
}) => {
  if (!event) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup-content">
        <h2 className="text-xl font-bold mb-4">Event Details</h2>
        <p>
          <strong>Description:</strong> {event.description}
        </p>
        <p>
          <strong>Start Date:</strong> {event.start_date}
        </p>
        <p>
          <strong>End Date:</strong> {event.end_date || "N/A"}
        </p>
        <button
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default EventDetailPopup;
