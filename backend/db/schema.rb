# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_05_10_080719) do
  create_table "active_storage_attachments", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "activity_materials", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "farm_activity_id", null: false
    t.bigint "farm_material_id", null: false
    t.float "planned_quantity", null: false
    t.float "actual_quantity"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["farm_activity_id", "farm_material_id"], name: "idx_activity_materials_on_activity_and_material", unique: true
    t.index ["farm_activity_id"], name: "index_activity_materials_on_farm_activity_id"
    t.index ["farm_material_id"], name: "index_activity_materials_on_farm_material_id"
  end

  create_table "conversations", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "product_listing_id"
    t.bigint "sender_id", null: false
    t.bigint "receiver_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_listing_id", "sender_id", "receiver_id"], name: "idx_unique_conversations", unique: true
    t.index ["product_listing_id"], name: "index_conversations_on_product_listing_id"
    t.index ["receiver_id"], name: "index_conversations_on_receiver_id"
    t.index ["sender_id"], name: "index_conversations_on_sender_id"
  end

  create_table "crop_animals", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "crop_type", null: false
    t.string "name", null: false
    t.integer "field_area"
    t.date "planting_date"
    t.date "harvest_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.integer "status", default: 0, null: false
    t.text "description"
    t.string "location"
    t.integer "quantity"
    t.string "variety"
    t.string "source"
    t.bigint "field_id"
    t.index ["field_id"], name: "index_crop_animals_on_field_id"
    t.index ["user_id", "crop_type"], name: "index_crop_animals_on_user_id_and_crop_type"
    t.index ["user_id", "status"], name: "index_crop_animals_on_user_id_and_status"
    t.index ["user_id"], name: "index_crop_animals_on_user_id"
  end

  create_table "farm_activities", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "crop_animal_id"
    t.integer "activity_type", null: false
    t.string "description"
    t.integer "frequency"
    t.integer "status"
    t.date "start_date"
    t.date "end_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.date "actual_completion_date"
    t.text "actual_notes"
    t.bigint "parent_activity_id"
    t.bigint "field_id"
    t.json "coordinates"
    t.index ["field_id"], name: "index_farm_activities_on_field_id"
    t.index ["parent_activity_id"], name: "index_farm_activities_on_parent_activity_id"
  end

  create_table "farm_materials", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.integer "user_id", null: false
    t.integer "material_id", null: false
    t.decimal "quantity", precision: 10, null: false
    t.timestamp "last_updated", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "unit"
    t.integer "category", default: 4
  end

  create_table "fields", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.bigint "user_id", null: false
    t.json "coordinates"
    t.decimal "area", precision: 10, scale: 2
    t.string "description"
    t.string "location"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_fields_on_user_id"
  end

  create_table "harvests", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "crop_id", null: false
    t.decimal "quantity", precision: 10, scale: 2, null: false
    t.timestamp "harvest_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.json "coordinates"
    t.bigint "field_id"
    t.bigint "farm_activity_id"
    t.index ["farm_activity_id"], name: "index_harvests_on_farm_activity_id"
    t.index ["field_id"], name: "index_harvests_on_field_id"
  end

  create_table "members", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "coop_id", null: false
    t.timestamp "join_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "messages", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "conversation_id", null: false
    t.bigint "user_id", null: false
    t.text "content", null: false
    t.boolean "read", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["conversation_id", "created_at"], name: "index_messages_on_conversation_id_and_created_at"
    t.index ["conversation_id"], name: "index_messages_on_conversation_id"
    t.index ["user_id", "read"], name: "index_messages_on_user_id_and_read"
    t.index ["user_id"], name: "index_messages_on_user_id"
  end

  create_table "product_images", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "product_listing_id", null: false
    t.integer "position", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_listing_id", "position"], name: "index_product_images_on_product_listing_id_and_position"
    t.index ["product_listing_id"], name: "index_product_images_on_product_listing_id"
  end

  create_table "product_listings", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "crop_animal_id"
    t.string "title", null: false
    t.text "description"
    t.integer "status", default: 1, null: false
    t.string "product_type", null: false
    t.integer "quantity"
    t.decimal "total_weight", precision: 10, scale: 2
    t.decimal "average_size", precision: 10, scale: 2
    t.decimal "price_expectation", precision: 10, scale: 2
    t.string "province"
    t.string "district"
    t.string "ward"
    t.string "address"
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.date "harvest_start_date"
    t.date "harvest_end_date"
    t.integer "view_count", default: 0
    t.integer "message_count", default: 0
    t.integer "order_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["crop_animal_id"], name: "index_product_listings_on_crop_animal_id"
    t.index ["harvest_start_date", "harvest_end_date"], name: "idx_on_harvest_start_date_harvest_end_date_55751c2310"
    t.index ["product_type"], name: "index_product_listings_on_product_type"
    t.index ["province"], name: "index_product_listings_on_province"
    t.index ["status"], name: "index_product_listings_on_status"
    t.index ["user_id"], name: "index_product_listings_on_user_id"
  end

  create_table "product_orders", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "product_listing_id", null: false
    t.bigint "buyer_id", null: false
    t.integer "status", default: 0
    t.decimal "quantity", precision: 10, scale: 2, null: false
    t.decimal "price", precision: 10, scale: 2
    t.text "note"
    t.text "rejection_reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["buyer_id"], name: "index_product_orders_on_buyer_id"
    t.index ["product_listing_id"], name: "index_product_orders_on_product_listing_id"
    t.index ["status"], name: "index_product_orders_on_status"
  end

  create_table "sales", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "crop_id", null: false
    t.decimal "quantity", precision: 10, scale: 2, null: false
    t.decimal "price", precision: 10, scale: 2, null: false
    t.timestamp "sale_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "supplier_reviews", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "supply_listing_id", null: false
    t.bigint "supply_order_id", null: false
    t.bigint "reviewer_id", null: false
    t.bigint "supplier_id", null: false
    t.integer "rating", null: false
    t.text "content"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["reviewer_id"], name: "index_supplier_reviews_on_reviewer_id"
    t.index ["supplier_id"], name: "index_supplier_reviews_on_supplier_id"
    t.index ["supply_listing_id"], name: "index_supplier_reviews_on_supply_listing_id"
    t.index ["supply_order_id"], name: "index_supplier_reviews_on_supply_order_id"
  end

  create_table "supply_images", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "supply_listing_id", null: false
    t.integer "position", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["supply_listing_id", "position"], name: "index_supply_images_on_supply_listing_id_and_position"
    t.index ["supply_listing_id"], name: "index_supply_images_on_supply_listing_id"
  end

  create_table "supply_listings", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name"
    t.bigint "user_id", null: false
    t.integer "category"
    t.decimal "price", precision: 10, scale: 2, null: false
    t.string "unit", null: false
    t.decimal "quantity", precision: 10, null: false
    t.timestamp "last_updated", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "description"
    t.integer "status", default: 1
    t.string "brand"
    t.string "manufacturer"
    t.date "manufacturing_date"
    t.date "expiry_date"
    t.string "province"
    t.string "district"
    t.string "ward"
    t.string "address"
    t.integer "view_count", default: 0
    t.integer "order_count", default: 0
    t.index ["category"], name: "index_supply_listings_on_category"
    t.index ["province"], name: "index_supply_listings_on_province"
    t.index ["status"], name: "index_supply_listings_on_status"
    t.index ["user_id"], name: "fk_rails_5869d02daf"
  end

  create_table "supply_orders", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.bigint "supply_listing_id", null: false
    t.decimal "quantity", precision: 10, scale: 2, null: false
    t.decimal "price", precision: 10, scale: 2, null: false
    t.timestamp "purchase_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "status", default: 0
    t.text "note"
    t.text "rejection_reason"
    t.string "delivery_province"
    t.string "delivery_district"
    t.string "delivery_ward"
    t.string "delivery_address"
    t.string "contact_phone"
    t.integer "payment_method", default: 0
    t.boolean "is_paid", default: false
    t.index ["status"], name: "index_supply_orders_on_status"
    t.index ["supply_listing_id"], name: "index_supply_orders_on_supply_listing_id"
    t.index ["user_id"], name: "index_supply_orders_on_user_id"
  end

  create_table "transactions", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "type"
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.text "description"
    t.timestamp "date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", primary_key: "user_id", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "user_type", null: false
    t.string "user_name", limit: 50, null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.integer "status", default: 0, null: false
    t.string "fullname"
    t.string "address"
    t.string "phone", limit: 20, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
  end

  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "activity_materials", "farm_activities"
  add_foreign_key "activity_materials", "farm_materials"
  add_foreign_key "conversations", "product_listings"
  add_foreign_key "conversations", "users", column: "receiver_id", primary_key: "user_id"
  add_foreign_key "conversations", "users", column: "sender_id", primary_key: "user_id"
  add_foreign_key "crop_animals", "fields"
  add_foreign_key "farm_activities", "farm_activities", column: "parent_activity_id"
  add_foreign_key "farm_activities", "fields"
  add_foreign_key "fields", "users", primary_key: "user_id"
  add_foreign_key "harvests", "farm_activities"
  add_foreign_key "harvests", "fields"
  add_foreign_key "messages", "conversations"
  add_foreign_key "messages", "users", primary_key: "user_id"
  add_foreign_key "product_images", "product_listings"
  add_foreign_key "product_listings", "crop_animals"
  add_foreign_key "product_listings", "users", primary_key: "user_id"
  add_foreign_key "product_orders", "product_listings"
  add_foreign_key "product_orders", "users", column: "buyer_id", primary_key: "user_id"
  add_foreign_key "supplier_reviews", "supply_listings"
  add_foreign_key "supplier_reviews", "supply_orders"
  add_foreign_key "supplier_reviews", "users", column: "reviewer_id", primary_key: "user_id"
  add_foreign_key "supplier_reviews", "users", column: "supplier_id", primary_key: "user_id"
  add_foreign_key "supply_images", "supply_listings"
  add_foreign_key "supply_listings", "users", primary_key: "user_id"
  add_foreign_key "supply_orders", "supply_listings"
end
