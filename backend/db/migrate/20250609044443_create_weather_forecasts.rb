class CreateWeatherForecasts < ActiveRecord::Migration[8.0]
  def change
    create_table :weather_forecasts do |t|
      t.references :field, null: true, foreign_key: true
      t.string :location_name, null: false
      t.float :latitude, null: false
      t.float :longitude, null: false
      t.json :current_data
      t.json :hourly_forecast
      t.json :daily_forecast
      t.datetime :last_updated_at, null: false

      t.timestamps
    end
    
    add_index :weather_forecasts, [:latitude, :longitude]
  end
end
