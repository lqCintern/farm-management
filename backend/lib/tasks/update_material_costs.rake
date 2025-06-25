namespace :farm do
  desc "Cập nhật đơn giá cho các vật tư hiện có"
  task update_material_costs: :environment do
    default_costs = {
      "fertilizer" => 50000,
      "pesticide" => 120000,
      "seed" => 80000,
      "tool" => 150000,
      "other" => 30000
    }
    
    puts "Bắt đầu cập nhật đơn giá vật tư..."
    count = 0
    
    # Duyệt qua từng vật tư chưa có giá
    Models::Farming::FarmMaterial.where("unit_cost IS NULL OR unit_cost = 0").each do |material|
      category = material.category.to_s
      default_cost = default_costs[category] || default_costs["other"]
      
      # Tính tổng chi phí
      total = material.quantity * default_cost
      
      # Cập nhật vật tư
      material.update!(unit_cost: default_cost, total_cost: total)
      
      # Tạo transaction ghi chú
      Models::Farming::FarmMaterialTransaction.create!(
        farm_material_id: material.id,
        user_id: material.user_id,
        quantity: material.quantity,
        unit_price: default_cost,
        transaction_type: "adjustment",
        notes: "Cập nhật giá mặc định cho vật tư"
      )
      
      count += 1
    end
    
    puts "Đã cập nhật #{count} vật tư."
  end
end