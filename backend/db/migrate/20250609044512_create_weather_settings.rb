class CreateWeatherSettings < ActiveRecord::Migration[8.0]
  def change
    create_table :weather_settings do |t|
      t.references :user, null: false, foreign_key: { to_table: :users, primary_key: :user_id }
      t.string :temperature_unit, default: 'metric'
      t.float :default_latitude
      t.float :default_longitude
      t.string :default_location_name
      t.boolean :alert_enabled, default: false
      t.json :alert_conditions

      t.timestamps
    end
  end
end
