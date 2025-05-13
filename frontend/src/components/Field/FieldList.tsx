import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import fieldService from "@/services/farming/fieldService";
import { Field } from "./types";
import { getRandomColor, filterFields, sortFields } from "./utils/fieldUtils";
import SearchContainer from "./components/search/SearchContainer";
import FieldMap from "./components/map/FieldMap";
import FieldListContainer from "./components/list/FieldListContainer";

const FieldList: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [labelOpacity] = useState<number>(0.8);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("name");

  // Fetch fields data
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fieldService.getFields();
        const fieldsWithColors = response.data.map((field: Field) => ({
          ...field,
          color: getRandomColor(),
        }));
        setFields(fieldsWithColors);
        setFilteredFields(fieldsWithColors);
      } catch (error) {
        console.error("Error fetching fields:", error);
      }
    };

    fetchFields();
  }, []);

  // Filter and sort fields when search term or sort method changes
  useEffect(() => {
    let result = filterFields(fields, searchTerm);
    result = sortFields(result, sortBy);
    setFilteredFields(result);
  }, [fields, searchTerm, sortBy]);

  // Handle field selection
  const handleFieldClick = (field: Field): void => {
    setSelectedField(field);
  };

  // Toggle filter dropdown
  const handleFilterToggle = () => {
    setFilterOpen(!filterOpen);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý cánh đồng
          </h1>
          <Link
            to="/fields/new"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FaPlus className="mr-2" /> Thêm cánh đồng
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filter */}
        <SearchContainer
          searchTerm={searchTerm}
          filterOpen={filterOpen}
          sortBy={sortBy}
          onSearchChange={setSearchTerm}
          onFilterToggle={handleFilterToggle}
          onSortChange={setSortBy}
        />

        {/* Main Content - Map and Field List */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map Section */}
          <div className="lg:w-2/3 bg-white rounded-lg shadow-sm p-4 relative">
            <FieldMap
              fields={filteredFields}
              selectedField={selectedField}
              onFieldClick={handleFieldClick}
              labelOpacity={labelOpacity}
            />
          </div>

          {/* Fields List */}
          <div className="lg:w-1/3">
            <FieldListContainer
              fields={filteredFields}
              selectedField={selectedField}
              onFieldSelect={handleFieldClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldList;
