import { useState, useEffect } from "react";
import BigCalendar from "@/components/Calendar/BigCalendar";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { getFarmActivities } from "@/services/farmService";
import { FarmActivity } from "@/types";
import FarmActivityModal from "@/components/form/farm_activity";

function Calendar() {
  const navigate = useNavigate();

  const [clickedDate, setClickedDate] = useState<string>(
    new Date().toDateString()
  );
  const [events, setEvents] = useState<any[]>([]);
  const [farmActivities, setFarmActivities] = useState<FarmActivity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchFarmActivities = async () => {
      try {
        const response = await getFarmActivities();
        console.log("API Response:", response);
        setFarmActivities(response.farm_activities);
      } catch (error) {
        console.error("Error fetching farm activities:", error);
      }
    };

    fetchFarmActivities();
  }, []);

  const handleAddActivity = (newActivity: FarmActivity) => {
    setFarmActivities((prev) => [...prev, newActivity]);
  };

  return (
    <div>
      <div className="flex p-5 gap-4">
        <button
          className="hover:bg-slate-200 hover:rounded-lg px-1"
          onClick={() => navigate("/")}
        >
          <FaArrowLeft size={24} />
        </button>
        <h1 className="font-normal text-3xl">Calendar</h1>
        <img
          width="40"
          height="25"
          src="https://img.icons8.com/material/24/calendar--v1.png"
          alt="calendar--v1"
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg ml-auto"
        >
          Add Activity
        </button>
      </div>
      <div className="flex justify-center">
        <BigCalendar
          setClickedDate={setClickedDate}
          setEvents={setEvents}
          farmActivities={farmActivities}
        />
      </div>

      {/* FarmActivityModal */}
      <FarmActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddActivity={handleAddActivity}
      />
    </div>
  );
}

export default Calendar;
