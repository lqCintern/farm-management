module Models
  module Farming
    class FarmMaterialTransaction < Models::ApplicationRecord
      belongs_to :farm_material
      belongs_to :source, polymorphic: true, optional: true
      
      validates :quantity, :unit_price, :total_price, :transaction_type, presence: true
      
      enum :transaction_type, {
        purchase: "purchase",
        adjustment: "adjustment", 
        consumption: "consumption"
      }
      
      before_validation :calculate_total_price
      
      private
      
      def calculate_total_price
        self.total_price = quantity * unit_price if quantity.present? && unit_price.present?
      end
    end
  end
end
