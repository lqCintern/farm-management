import { useEffect, useState } from "react";
import { getFarmActivities } from "@/services/farmService";
import FarmActivityItem from "./FarmActivityItem";
import { FarmActivity } from "@/types";
import FarmActivityModal from "@/components/form/farm_activity";

export default function FarmActivityList() {
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await getFarmActivities();
        console.log("API Response:", response);
        setActivities(response.farm_activities);
      } catch (error) {
        console.error("Error fetching farm activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const handleAddActivity = (newActivity: FarmActivity) => {
    setActivities((prev) => [...prev, newActivity]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 text-lg mb-4">No activities found.</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg"
        >
          Add Activity
        </button>
        <FarmActivityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddActivity={handleAddActivity}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Farm Activities</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg"
        >
          Add Activity
        </button>
      </div>
      <ul className="space-y-4">
        {activities.map((activity) => (
          <FarmActivityItem key={activity.id} activity={activity} />
        ))}
      </ul>
      <FarmActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddActivity={handleAddActivity}
      />
    </div>
  );
}
