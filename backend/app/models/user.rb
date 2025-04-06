class User < ApplicationRecord
    has_secure_password

    has_many :farm_materials, foreign_key: :user_id, dependent: :destroy
    has_many :product_materials, foreign_key: :supplier_id, dependent: :destroy
    has_many :transactions, foreign_key: :user_id, dependent: :destroy
    has_many :sales, foreign_key: :user_id, dependent: :destroy
    has_many :materials_purchases, foreign_key: :user_id, dependent: :destroy
    has_many :harvests, foreign_key: :user_id, dependent: :destroy
    has_one :member, foreign_key: :user_id, dependent: :destroy
    has_one :cooperative, foreign_key: :leader_id, dependent: :destroy

    validates :user_name, presence: true, length: { maximum: 255 }
    validates :email, presence: true, uniqueness: true, length: { maximum: 255 }
    validates :password, presence: true, length: { minimum: 6 }
    validates :phone, presence: true, length: { maximum: 255 }
end
