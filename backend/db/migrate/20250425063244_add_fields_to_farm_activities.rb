class AddFieldsToFarmActivities < ActiveRecord::Migration[6.1]
  def change
    add_column :farm_activities, :actual_completion_date, :date
    add_column :farm_activities, :actual_notes, :text
    add_reference :farm_activities, :parent_activity, foreign_key: { to_table: :farm_activities }, null: true
  end
end
