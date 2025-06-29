module Entities
  module Farming
    class FarmMaterial
      attr_accessor :id, :name, :material_id, :quantity, :unit, :category,
                    :user_id, :last_updated, :created_at, :updated_at,
                    :activity_materials, :available_quantity, :unit_cost, :total_cost, :supply_listing

      def initialize(attributes = {})
        attributes.each do |key, value|
          send("#{key}=", value) if respond_to?("#{key}=")
        end
      end

      def has_enough?(amount)
        available_quantity >= amount
      end
    end
  end
end
