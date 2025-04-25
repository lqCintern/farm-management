import React, { useState } from "react";
import FieldMap from "@/components/Map/FieldMap";
import { createHarvest } from "@/services/harvestService";

const HarvestForm: React.FC = () => {
  const [quantity, setQuantity] = useState<number>(0);
  const [harvestDate, setHarvestDate] = useState<string>("");
  const [coordinates, setCoordinates] = useState<google.maps.LatLngLiteral[]>(
    []
  );

  const handlePolygonComplete = (polygonData: google.maps.LatLngLiteral[]) => {
    setCoordinates(polygonData);
  };

  const handleSubmit = async () => {
    if (coordinates.length === 0) {
      alert("Please draw a polygon on the map to select the harvest area.");
      return;
    }

    try {
      const data = {
        quantity,
        harvest_date: harvestDate,
        coordinates,
      };
      const response = await createHarvest(data);
      console.log("Harvest created:", response);
      alert("Harvest created successfully!");
    } catch (error) {
      console.error("Error creating harvest:", error);
      alert("Failed to create harvest. Please try again.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create Harvest</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Quantity</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="border p-2 rounded w-full"
          placeholder="Enter quantity"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Harvest Date</label>
        <input
          type="date"
          value={harvestDate}
          onChange={(e) => setHarvestDate(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Select Harvest Area
        </label>
        <FieldMap onPolygonComplete={handlePolygonComplete} />
      </div>
      <button
        onClick={handleSubmit}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Submit Harvest
      </button>
    </div>
  );
};

export default HarvestForm;
