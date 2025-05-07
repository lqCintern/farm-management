import React from "react";
import SearchBar from "./SearchBar";
import FilterControls from "./FilterControls";

interface SearchContainerProps {
  searchTerm: string;
  filterOpen: boolean;
  sortBy: string;
  onSearchChange: (value: string) => void;
  onFilterToggle: () => void;
  onSortChange: (value: string) => void;
}

const SearchContainer: React.FC<SearchContainerProps> = ({
  searchTerm,
  filterOpen,
  sortBy,
  onSearchChange,
  onFilterToggle,
  onSortChange,
}) => {
  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-wrap gap-4">
        <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />
        <FilterControls
          filterOpen={filterOpen}
          sortBy={sortBy}
          onFilterToggle={onFilterToggle}
          onSortChange={onSortChange}
        />
      </div>
    </div>
  );
};

export default SearchContainer;
