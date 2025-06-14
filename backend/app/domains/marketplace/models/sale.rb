module Marketplace
  module Models
    class Sale < ApplicationRecord
        belongs_to :user, foreign_key: :user_id
        belongs_to :pineapple_crop, foreign_key: :crop_animal_id, optional: true, class_name: "Farming::PineappleCrop"

        validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
        validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
        validates :sale_date, presence: true
        end
  end
end