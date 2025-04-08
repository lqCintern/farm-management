class AddUserIdToFarmActivities < ActiveRecord::Migration[8.0]
  def change
    add_column :farm_activities, :user_id, :integer
  end
end
