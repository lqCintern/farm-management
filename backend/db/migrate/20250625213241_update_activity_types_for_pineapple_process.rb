class UpdateActivityTypesForPineappleProcess < ActiveRecord::Migration[8.0]
  def up
    # Cập nhật activity types trong farm_activities
    execute <<-SQL
      UPDATE farm_activities 
      SET activity_type = CASE 
        WHEN activity_type = 1 THEN 2  -- planting: 1 -> 2
        WHEN activity_type = 2 THEN 4  -- fertilizing: 2 -> 4
        WHEN activity_type = 3 THEN 11 -- watering: 3 -> 11
        WHEN activity_type = 4 THEN 5  -- pesticide: 4 -> 5
        WHEN activity_type = 5 THEN 3  -- pruning -> leaf_tying: 5 -> 3
        WHEN activity_type = 6 THEN 12 -- weeding: 6 -> 12
        WHEN activity_type = 7 THEN 8  -- harvesting: 7 -> 8
        WHEN activity_type = 8 THEN 13 -- other: 8 -> 13
        ELSE activity_type
      END
    SQL

    # Cập nhật activity types trong pineapple_activity_templates
    execute <<-SQL
      UPDATE pineapple_activity_templates 
      SET activity_type = CASE 
        WHEN activity_type = 1 THEN 2  -- planting: 1 -> 2
        WHEN activity_type = 2 THEN 4  -- fertilizing: 2 -> 4
        WHEN activity_type = 3 THEN 11 -- watering: 3 -> 11
        WHEN activity_type = 4 THEN 5  -- pesticide: 4 -> 5
        WHEN activity_type = 5 THEN 3  -- pruning -> leaf_tying: 5 -> 3
        WHEN activity_type = 6 THEN 12 -- weeding: 6 -> 12
        WHEN activity_type = 7 THEN 8  -- harvesting: 7 -> 8
        WHEN activity_type = 8 THEN 13 -- other: 8 -> 13
        ELSE activity_type
      END
    SQL
  end

  def down
    # Rollback activity types
    execute <<-SQL
      UPDATE farm_activities 
      SET activity_type = CASE 
        WHEN activity_type = 2 THEN 1  -- planting: 2 -> 1
        WHEN activity_type = 4 THEN 2  -- fertilizing: 4 -> 2
        WHEN activity_type = 11 THEN 3 -- watering: 11 -> 3
        WHEN activity_type = 5 THEN 4  -- pesticide: 5 -> 4
        WHEN activity_type = 3 THEN 5  -- leaf_tying -> pruning: 3 -> 5
        WHEN activity_type = 12 THEN 6 -- weeding: 12 -> 6
        WHEN activity_type = 8 THEN 7  -- harvesting: 8 -> 7
        WHEN activity_type = 13 THEN 8 -- other: 13 -> 8
        ELSE activity_type
      END
    SQL

    execute <<-SQL
      UPDATE pineapple_activity_templates 
      SET activity_type = CASE 
        WHEN activity_type = 2 THEN 1  -- planting: 2 -> 1
        WHEN activity_type = 4 THEN 2  -- fertilizing: 4 -> 2
        WHEN activity_type = 11 THEN 3 -- watering: 11 -> 3
        WHEN activity_type = 5 THEN 4  -- pesticide: 5 -> 4
        WHEN activity_type = 3 THEN 5  -- leaf_tying -> pruning: 3 -> 5
        WHEN activity_type = 12 THEN 6 -- weeding: 12 -> 6
        WHEN activity_type = 8 THEN 7  -- harvesting: 8 -> 7
        WHEN activity_type = 13 THEN 8 -- other: 13 -> 8
        ELSE activity_type
      END
    SQL
  end
end
