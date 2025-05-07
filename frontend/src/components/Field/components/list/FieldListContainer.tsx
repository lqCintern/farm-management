import React from "react";
import FieldListItem from "./FieldListItem";
import EmptyFieldList from "./EmptyFieldList";
import { Field } from "@/components/Field/types";

interface FieldListContainerProps {
  fields: Field[];
  selectedField: Field | null;
  onFieldSelect: (field: Field) => void;
}

const FieldListContainer: React.FC<FieldListContainerProps> = ({
  fields,
  selectedField,
  onFieldSelect,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">
          Danh sách cánh đồng ({fields.length})
        </h2>
      </div>
      <div className="overflow-y-auto max-h-[550px] p-2">
        {fields.length > 0 ? (
          <div className="space-y-3">
            {fields.map((field) => (
              <FieldListItem
                key={field.id}
                field={field}
                isSelected={!!(selectedField && selectedField.id === field.id)}
                onClick={() => onFieldSelect(field)}
              />
            ))}
          </div>
        ) : (
          <EmptyFieldList />
        )}
      </div>
    </div>
  );
};

export default FieldListContainer;
