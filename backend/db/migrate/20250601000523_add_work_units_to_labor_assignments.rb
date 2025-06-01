class AddWorkUnitsToLaborAssignments < ActiveRecord::Migration[8.0]
  def change
    add_column :labor_assignments, :work_units, :decimal, precision: 5, scale: 2, default: 0
    add_column :labor_assignments, :exchange_processed, :boolean, default: false
  end
end
