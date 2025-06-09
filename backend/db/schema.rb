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

ActiveRecord::Schema[8.0].define(version: 2025_06_09_044512) do
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

  create_table "activity_logs", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "action_type", null: false
    t.string "target_type"
    t.bigint "target_id"
    t.json "details"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action_type"], name: "index_activity_logs_on_action_type"
    t.index ["target_type", "target_id"], name: "index_activity_logs_on_target_type_and_target_id"
    t.index ["user_id"], name: "index_activity_logs_on_user_id"
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

  create_table "labor_assignments", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "labor_request_id", null: false
    t.bigint "worker_id", null: false
    t.bigint "home_household_id", null: false
    t.date "work_date", null: false
    t.time "start_time"
    t.time "end_time"
    t.decimal "hours_worked", precision: 5, scale: 2
    t.integer "status", default: 0
    t.text "notes"
    t.integer "worker_rating"
    t.integer "farmer_rating"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "work_units", precision: 5, scale: 2, default: "0.0"
    t.boolean "exchange_processed", default: false
    t.index ["home_household_id"], name: "index_labor_assignments_on_home_household_id"
    t.index ["labor_request_id"], name: "index_labor_assignments_on_labor_request_id"
    t.index ["work_date"], name: "index_labor_assignments_on_work_date"
    t.index ["worker_id"], name: "index_labor_assignments_on_worker_id"
  end

  create_table "labor_exchange_transactions", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "labor_exchange_id", null: false
    t.bigint "labor_assignment_id", null: false
    t.decimal "hours", precision: 5, scale: 2
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["labor_assignment_id"], name: "idx_labor_exchange_transactions_on_assignment_id"
    t.index ["labor_exchange_id"], name: "index_labor_exchange_transactions_on_labor_exchange_id"
  end

  create_table "labor_exchanges", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "household_a_id", null: false
    t.bigint "household_b_id", null: false
    t.decimal "hours_balance", precision: 8, scale: 2, default: "0.0"
    t.text "notes"
    t.datetime "last_transaction_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["household_a_id", "household_b_id"], name: "index_labor_exchanges_on_households", unique: true
    t.index ["household_b_id"], name: "fk_rails_21ece1a2c7"
  end

  create_table "labor_farm_households", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.bigint "owner_id", null: false
    t.text "description"
    t.string "province"
    t.string "district"
    t.string "ward"
    t.string "address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["owner_id"], name: "index_labor_farm_households_on_owner_id"
  end

  create_table "labor_household_workers", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "household_id", null: false
    t.bigint "worker_id", null: false
    t.string "relationship"
    t.boolean "is_active", default: true
    t.date "joined_date"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["household_id"], name: "index_labor_household_workers_on_household_id"
    t.index ["worker_id"], name: "index_labor_household_workers_on_worker_id", unique: true
  end

  create_table "labor_requests", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "requesting_household_id", null: false
    t.bigint "providing_household_id"
    t.bigint "farm_activity_id"
    t.string "title", null: false
    t.text "description"
    t.integer "workers_needed"
    t.integer "request_type", default: 0
    t.decimal "rate", precision: 10, scale: 2
    t.date "start_date"
    t.date "end_date"
    t.time "start_time"
    t.time "end_time"
    t.integer "status", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "request_group_id", comment: "ID nhóm cho các yêu cầu liên quan"
    t.bigint "parent_request_id", comment: "ID của yêu cầu gốc trong nhóm"
    t.boolean "is_public", default: false, comment: "Yêu cầu có thể được xem bởi tất cả"
    t.integer "max_acceptors", comment: "Số lượng tối đa household được chấp nhận"
    t.index ["farm_activity_id"], name: "index_labor_requests_on_farm_activity_id"
    t.index ["is_public"], name: "index_labor_requests_on_is_public"
    t.index ["parent_request_id"], name: "index_labor_requests_on_parent_request_id"
    t.index ["providing_household_id"], name: "index_labor_requests_on_providing_household_id"
    t.index ["request_group_id"], name: "index_labor_requests_on_request_group_id"
    t.index ["requesting_household_id"], name: "index_labor_requests_on_requesting_household_id"
  end

  create_table "labor_worker_profiles", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.text "skills"
    t.decimal "daily_rate", precision: 10, scale: 2
    t.decimal "hourly_rate", precision: 10, scale: 2
    t.integer "availability", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_labor_worker_profiles_on_user_id", unique: true
  end

  create_table "marketplace_harvests", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "product_listing_id", null: false
    t.bigint "product_order_id"
    t.bigint "trader_id", null: false
    t.datetime "scheduled_date", null: false
    t.string "location", null: false
    t.text "notes"
    t.decimal "estimated_quantity", precision: 10
    t.decimal "actual_quantity", precision: 10
    t.decimal "estimated_price", precision: 10
    t.decimal "final_price", precision: 10
    t.integer "status", default: 0
    t.datetime "payment_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_listing_id"], name: "index_marketplace_harvests_on_product_listing_id"
    t.index ["product_order_id"], name: "index_marketplace_harvests_on_product_order_id"
    t.index ["status"], name: "index_marketplace_harvests_on_status"
    t.index ["trader_id"], name: "index_marketplace_harvests_on_trader_id"
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

  create_table "notification_settings", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "category", null: false
    t.string "event_type"
    t.boolean "email_enabled", default: true
    t.boolean "push_enabled", default: true
    t.boolean "in_app_enabled", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "category", "event_type"], name: "unique_notification_setting", unique: true
  end

  create_table "notifications", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "recipient_id", null: false
    t.bigint "sender_id"
    t.string "notifiable_type"
    t.bigint "notifiable_id"
    t.string "category", null: false
    t.string "event_type", null: false
    t.string "title", null: false
    t.text "message", null: false
    t.json "metadata"
    t.datetime "read_at"
    t.datetime "sent_via_email_at"
    t.datetime "sent_via_push_at"
    t.integer "priority", default: 1
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_notifications_on_category"
    t.index ["created_at"], name: "index_notifications_on_created_at"
    t.index ["event_type"], name: "index_notifications_on_event_type"
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable_type_and_notifiable_id"
    t.index ["recipient_id", "read_at"], name: "index_notifications_on_recipient_id_and_read_at"
    t.index ["sender_id"], name: "fk_rails_8780923399"
  end

  create_table "pineapple_activity_templates", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.integer "activity_type", null: false
    t.integer "stage", null: false
    t.integer "day_offset"
    t.integer "duration_days"
    t.string "season_specific"
    t.boolean "is_required", default: true
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_pineapple_activity_templates_on_user_id"
  end

  create_table "pineapple_crops", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "crop_type", default: 0, null: false
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
    t.string "season_type", comment: "Vụ: Xuân-Hè hoặc Thu-Đông"
    t.integer "planting_density", comment: "Mật độ trồng (cây/ha)"
    t.date "land_preparation_date", comment: "Ngày chuẩn bị đất"
    t.date "expected_flower_date", comment: "Ngày dự kiến ra hoa"
    t.date "actual_flower_date", comment: "Ngày thực tế ra hoa"
    t.integer "current_stage", default: 0, comment: "Giai đoạn hiện tại: 0-Chuẩn bị, 1-Trồng, 2-Chăm sóc, etc."
    t.date "current_stage_start_date", comment: "Ngày bắt đầu giai đoạn hiện tại"
    t.json "fertilizer_schedule", comment: "Lịch bón phân"
    t.date "flower_treatment_date", comment: "Ngày xử lý ra hoa"
    t.date "tie_date", comment: "Ngày buộc lá (áp dụng vụ Xuân-Hè)"
    t.decimal "expected_yield", precision: 10, scale: 2, comment: "Sản lượng dự kiến (kg)"
    t.decimal "actual_yield", precision: 10, scale: 2, comment: "Sản lượng thực tế (kg)"
    t.decimal "completion_percentage", precision: 5, scale: 2, default: "0.0", comment: "Phần trăm hoàn thành chu kỳ"
    t.index ["current_stage"], name: "index_pineapple_crops_on_current_stage"
    t.index ["field_id"], name: "index_pineapple_crops_on_field_id"
    t.index ["harvest_date"], name: "index_pineapple_crops_on_harvest_date"
    t.index ["planting_date"], name: "index_pineapple_crops_on_planting_date"
    t.index ["season_type"], name: "index_pineapple_crops_on_season_type"
    t.index ["user_id", "crop_type"], name: "index_pineapple_crops_on_user_id_and_crop_type"
    t.index ["user_id", "status"], name: "index_pineapple_crops_on_user_id_and_status"
    t.index ["user_id"], name: "index_pineapple_crops_on_user_id"
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
    t.integer "user_id", null: false
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
    t.decimal "pending_quantity", precision: 10, scale: 2, default: "0.0"
    t.decimal "sold_quantity", precision: 10, scale: 2, default: "0.0"
    t.index ["category"], name: "index_supply_listings_on_category"
    t.index ["province"], name: "index_supply_listings_on_province"
    t.index ["status"], name: "index_supply_listings_on_status"
  end

  create_table "supply_orders", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "supply_id", null: false
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
    t.bigint "supply_listing_id"
    t.index ["status"], name: "index_supply_orders_on_status"
    t.index ["supply_listing_id"], name: "index_supply_orders_on_supply_listing_id"
    t.index ["user_id"], name: "index_supply_orders_on_user_id"
  end

  create_table "transactions", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "transaction_type"
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

  create_table "weather_forecasts", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "field_id"
    t.string "location_name", null: false
    t.float "latitude", null: false
    t.float "longitude", null: false
    t.json "current_data"
    t.json "hourly_forecast"
    t.json "daily_forecast"
    t.datetime "last_updated_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["field_id"], name: "index_weather_forecasts_on_field_id"
    t.index ["latitude", "longitude"], name: "index_weather_forecasts_on_latitude_and_longitude"
  end

  create_table "weather_settings", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "temperature_unit", default: "metric"
    t.float "default_latitude"
    t.float "default_longitude"
    t.string "default_location_name"
    t.boolean "alert_enabled", default: false
    t.json "alert_conditions"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_weather_settings_on_user_id"
  end

  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "activity_logs", "users", primary_key: "user_id"
  add_foreign_key "activity_materials", "farm_activities"
  add_foreign_key "activity_materials", "farm_materials"
  add_foreign_key "conversations", "product_listings"
  add_foreign_key "conversations", "users", column: "receiver_id", primary_key: "user_id"
  add_foreign_key "conversations", "users", column: "sender_id", primary_key: "user_id"
  add_foreign_key "farm_activities", "farm_activities", column: "parent_activity_id"
  add_foreign_key "farm_activities", "fields"
  add_foreign_key "fields", "users", primary_key: "user_id"
  add_foreign_key "harvests", "farm_activities"
  add_foreign_key "harvests", "fields"
  add_foreign_key "labor_assignments", "labor_farm_households", column: "home_household_id"
  add_foreign_key "labor_assignments", "labor_requests"
  add_foreign_key "labor_assignments", "users", column: "worker_id", primary_key: "user_id"
  add_foreign_key "labor_exchange_transactions", "labor_assignments"
  add_foreign_key "labor_exchange_transactions", "labor_exchanges"
  add_foreign_key "labor_exchanges", "labor_farm_households", column: "household_a_id"
  add_foreign_key "labor_exchanges", "labor_farm_households", column: "household_b_id"
  add_foreign_key "labor_farm_households", "users", column: "owner_id", primary_key: "user_id"
  add_foreign_key "labor_household_workers", "labor_farm_households", column: "household_id"
  add_foreign_key "labor_household_workers", "users", column: "worker_id", primary_key: "user_id"
  add_foreign_key "labor_requests", "farm_activities"
  add_foreign_key "labor_requests", "labor_farm_households", column: "providing_household_id"
  add_foreign_key "labor_requests", "labor_farm_households", column: "requesting_household_id"
  add_foreign_key "labor_requests", "labor_requests", column: "parent_request_id"
  add_foreign_key "labor_worker_profiles", "users", primary_key: "user_id"
  add_foreign_key "marketplace_harvests", "product_listings"
  add_foreign_key "marketplace_harvests", "product_orders"
  add_foreign_key "marketplace_harvests", "users", column: "trader_id", primary_key: "user_id"
  add_foreign_key "messages", "conversations"
  add_foreign_key "messages", "users", primary_key: "user_id"
  add_foreign_key "notification_settings", "users", primary_key: "user_id"
  add_foreign_key "notifications", "users", column: "recipient_id", primary_key: "user_id"
  add_foreign_key "notifications", "users", column: "sender_id", primary_key: "user_id", on_delete: :nullify
  add_foreign_key "pineapple_crops", "fields"
  add_foreign_key "product_images", "product_listings"
  add_foreign_key "product_listings", "pineapple_crops", column: "crop_animal_id"
  add_foreign_key "product_listings", "users", primary_key: "user_id"
  add_foreign_key "product_orders", "product_listings"
  add_foreign_key "product_orders", "users", column: "buyer_id", primary_key: "user_id"
  add_foreign_key "supplier_reviews", "supply_listings"
  add_foreign_key "supplier_reviews", "supply_orders"
  add_foreign_key "supplier_reviews", "users", column: "reviewer_id", primary_key: "user_id"
  add_foreign_key "supplier_reviews", "users", column: "supplier_id", primary_key: "user_id"
  add_foreign_key "supply_images", "supply_listings"
  add_foreign_key "supply_orders", "supply_listings"
  add_foreign_key "weather_forecasts", "fields"
  add_foreign_key "weather_settings", "users", primary_key: "user_id"
end
