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

ActiveRecord::Schema[8.0].define(version: 2025_04_25_063254) do
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

  create_table "crop_animals", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "crop_type", null: false
    t.string "name", null: false
    t.integer "area"
    t.date "start_date"
    t.date "end_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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

  create_table "harvests", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "crop_id", null: false
    t.decimal "quantity", precision: 10, scale: 2, null: false
    t.timestamp "harvest_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.json "coordinates"
  end

  create_table "materials_purchases", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "supply_id", null: false
    t.decimal "quantity", precision: 10, scale: 2, null: false
    t.decimal "price", precision: 10, scale: 2, null: false
    t.timestamp "purchase_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "members", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "coop_id", null: false
    t.timestamp "join_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "product_materials", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name"
    t.integer "supplier_id", null: false
    t.integer "category"
    t.decimal "price", precision: 10, scale: 2, null: false
    t.string "unit", null: false
    t.decimal "stock", precision: 10, null: false
    t.timestamp "last_updated", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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

  add_foreign_key "activity_materials", "farm_activities"
  add_foreign_key "activity_materials", "farm_materials"
  add_foreign_key "farm_activities", "farm_activities", column: "parent_activity_id"
end
