class FarmActivitySerializer
  include JSONAPI::Serializer

  attributes :id, :activity_type, :description, :frequency, :status, :start_date, :end_date, :crop_animal_id, :created_at, :updated_at
end
