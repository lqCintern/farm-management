module Services
  module Farming
    class FarmMaterialStatisticsService
      def initialize(farm_material_repository, transaction_repository, activity_material_repository)
        @farm_material_repository = farm_material_repository
        @transaction_repository = transaction_repository
        @activity_material_repository = activity_material_repository
      end

      def get_material_details(id, user_id)
        material = @farm_material_repository.find_by_id(id, user_id)
        return { success: false, error: "Vật tư không tồn tại" } unless material

        # Lấy lịch sử giao dịch
        transactions = @transaction_repository.find_by_material_id(id, user_id)

        # Lấy hoạt động sử dụng
        activities = @activity_material_repository.find_by_material_id(id, user_id)

        # Tính toán thống kê
        statistics = calculate_material_statistics(material, transactions, activities)

        {
          success: true,
          material: material,
          transactions: @transaction_repository.map_transactions_to_dto(transactions),
          activities: @activity_material_repository.map_activities_to_dto(activities),
          statistics: statistics
        }
      end

      def get_statistics(user_id, filters = {})
        # Lấy toàn bộ vật tư
        materials = @farm_material_repository.find_by_user(user_id)
        
        # Lấy hoạt động
        activity_materials = ::Models::Farming::ActivityMaterial
          .joins(:farm_material)
          .joins(:farm_activity)
          .where(farm_materials: { user_id: user_id })
        
        # Áp dụng bộ lọc
        activity_materials = @activity_material_repository.apply_date_filters(activity_materials, filters)
        activity_materials = @activity_material_repository.apply_field_filter(activity_materials, filters)
        activity_materials = @activity_material_repository.apply_crop_filter(activity_materials, filters)
        
        # Phân tích dữ liệu
        basic_stats = calculate_basic_stats(materials)
        by_category = analyze_by_category(materials, activity_materials)
        most_used = get_most_used_materials(activity_materials)
        monthly_data = get_monthly_data(activity_materials)
        details = get_material_usage_details(activity_materials)
        trends = calculate_trends(activity_materials, filters)
        
        {
          success: true,
          statistics: basic_stats.merge({
            by_category: by_category,
            most_used: most_used,
            trends: trends
          }),
          details: details,
          monthly_data: monthly_data
        }
      end

      private

      def calculate_material_statistics(material, transactions, activities)
        # Tổng số lần nhập kho
        purchase_count = transactions.count { |t| t.transaction_type == "purchase" }
        
        # Tổng số lượng đã nhập
        total_purchased = transactions
          .select { |t| t.transaction_type == "purchase" }
          .sum(&:quantity)
          
        # Tổng chi phí mua
        total_purchase_cost = transactions
          .select { |t| t.transaction_type == "purchase" }
          .sum(&:total_price)
          
        # Tổng số lượng đã sử dụng
        total_used = activities.sum { |a| a.actual_quantity || a.planned_quantity }
        
        # Số hoạt động đã sử dụng vật tư này
        activities_count = activities.count
        
        # Tần suất sử dụng theo tháng (trong 6 tháng gần nhất)
        six_months_ago = Date.today - 6.months
        recent_activities = activities.select { |a| a.farm_activity.start_date && a.farm_activity.start_date >= six_months_ago }
        
        usage_by_month = {}
        recent_activities.each do |activity|
          date = activity.farm_activity.start_date
          month_key = "#{date.month}/#{date.year}"
          
          if usage_by_month[month_key]
            usage_by_month[month_key] += activity.actual_quantity || activity.planned_quantity
          else
            usage_by_month[month_key] = activity.actual_quantity || activity.planned_quantity
          end
        end
        
        # Dự báo thời gian cạn kiệt (nếu có đủ dữ liệu)
        depletion_forecast = nil
        if recent_activities.any?
          # Tính tốc độ tiêu thụ trung bình mỗi ngày
          total_recent_usage = recent_activities.sum { |a| a.actual_quantity || a.planned_quantity }
          days = [(Date.today - six_months_ago).to_i, 1].max
          daily_usage = total_recent_usage / days
          
          if daily_usage > 0
            days_remaining = material.quantity / daily_usage
            depletion_forecast = {
              daily_usage: daily_usage,
              days_remaining: days_remaining.to_i,
              depletion_date: Date.today + days_remaining.to_i.days
            }
          end
        end
        
        {
          purchase_count: purchase_count,
          total_purchased: total_purchased,
          total_purchase_cost: total_purchase_cost,
          current_quantity: material.quantity,
          current_value: material.quantity * material.unit_cost,
          total_used: total_used,
          activities_count: activities_count,
          usage_by_month: usage_by_month.map { |month, quantity| { month: month, quantity: quantity } },
          depletion_forecast: depletion_forecast
        }
      end

      def calculate_basic_stats(materials)
        {
          total_items: materials.count,
          low_stock_count: materials.count { |m| m.quantity > 0 && m.quantity <= 10 },
          out_of_stock_count: materials.count { |m| m.quantity <= 0 },
          categories: materials.map(&:category).compact.uniq.count,
          total_cost: estimate_total_cost(materials)
        }
      end
      
      def estimate_total_cost(materials)
        materials.sum do |material|
          material.unit_cost ? (material.quantity * material.unit_cost) : 0
        end
      end
      
      def analyze_by_category(materials, activity_materials)
        # Tính tổng số lượng theo loại vật tư
        result = {}
        
        # Nhóm vật tư theo loại
        materials.group_by(&:category).each do |category, items|
          # Tổng số lượng hiện có
          total_quantity = items.sum(&:quantity)
          
          # Tổng số lượng đã sử dụng
          planned_usage = activity_materials
            .joins(:farm_material)
            .where(farm_materials: { category: category })
            .sum(:planned_quantity)
            
          actual_usage = activity_materials
            .joins(:farm_material)
            .where(farm_materials: { category: category })
            .where.not(actual_quantity: nil)
            .sum(:actual_quantity)
          
          # Tính chi phí thực tế
          category_cost = items.sum { |item| (item.unit_cost || 0) * item.quantity }
          
          category_name = I18n.t("farming.material_categories.#{category}", default: category.humanize)
          
          result[category] = {
            name: category_name,
            inventory_quantity: total_quantity,
            planned_usage: planned_usage,
            actual_usage: actual_usage > 0 ? actual_usage : nil,
            cost: category_cost
          }
        end
        
        # Chuyển hash thành mảng để frontend dễ sử dụng
        result.map { |category, data| data.merge(category: category) }
      end
      
      def get_most_used_materials(activity_materials)
        # Nhóm theo farm_material_id và tính tổng số lượng sử dụng
        usage_by_material = activity_materials
          .select("farm_materials.*, SUM(COALESCE(activity_materials.actual_quantity, activity_materials.planned_quantity)) as total_usage")
          .joins(:farm_material)
          .group("farm_materials.id, farm_materials.name, farm_materials.category, farm_materials.unit, farm_materials.unit_cost")
          .order("total_usage DESC")
          .limit(5)
        
        # Định dạng kết quả
        usage_by_material.map do |material|
          unit_cost = material.unit_cost || 0
                       
          {
            id: material.id,
            name: material.name,
            category: material.category,
            quantity: material.total_usage.to_f,
            unit: material.unit,
            cost: material.total_usage.to_f * unit_cost
          }
        end
      end
      
      def get_monthly_data(activity_materials)
        # Lấy dữ liệu sử dụng vật tư theo tháng
        monthly_data = activity_materials
          .joins(:farm_activity)
          .select("YEAR(farm_activities.start_date) as year, 
                  MONTH(farm_activities.start_date) as month, 
                  SUM(COALESCE(activity_materials.actual_quantity, activity_materials.planned_quantity)) as total_usage")
          .group("YEAR(farm_activities.start_date), MONTH(farm_activities.start_date)")
          .order("year, month")
        
        # Định dạng kết quả
        monthly_data.map do |data|
          # Lấy giá trung bình của các vật tư được sử dụng trong tháng
          month_materials = activity_materials
            .joins(:farm_activity)
            .joins(:farm_material)
            .where("YEAR(farm_activities.start_date) = ? AND MONTH(farm_activities.start_date) = ?", data.year, data.month)
          
          # Tính chi phí dựa trên giá trung bình thực tế
          avg_cost = month_materials.average("farm_materials.unit_cost") || 0
          usage = data.total_usage.to_f
          
          {
            year: data.year,
            month: data.month,
            used_quantity: usage,
            cost: (usage * avg_cost).round(2)
          }
        end
      end
      
      def get_material_usage_details(activity_materials)
        # Lấy chi tiết sử dụng vật tư
        details = activity_materials
          .select("activity_materials.*, 
                  farm_materials.name as material_name, 
                  farm_materials.category as category,
                  farm_materials.unit as unit,
                  farm_materials.unit_cost as unit_cost,
                  farm_activities.start_date as used_date,
                  farm_activities.description as activity_name,
                  fields.name as field_name")
          .joins(:farm_material)
          .joins(:farm_activity)
          .joins("LEFT JOIN fields ON farm_activities.field_id = fields.id")
          .order("farm_activities.start_date DESC")
        
        # Định dạng kết quả
        details.map do |detail|
          unit_price = detail.unit_cost || 0
          quantity = detail.actual_quantity || detail.planned_quantity
          
          {
            id: detail.id,
            name: detail.material_name,
            category: detail.category,
            quantity: quantity.to_f,
            unit: detail.unit,
            used_date: detail.used_date,
            activity_name: detail.activity_name,
            field_name: detail.field_name || "Không có ruộng",
            unit_price: unit_price,
            total_price: (quantity.to_f * unit_price).round(2)
          }
        end
      end
      
      def calculate_trends(activity_materials, filters)
        # Tính xu hướng sử dụng vật tư
        if filters[:start_date].present? && filters[:end_date].present?
          start_date = Date.parse(filters[:start_date])
          end_date = Date.parse(filters[:end_date])
          duration = (end_date - start_date).to_i
          
          # Tính kỳ trước
          previous_start = start_date - duration.days
          previous_end = start_date - 1.day
          
          # Chi phí kỳ hiện tại
          current_usage = activity_materials
            .joins(:farm_activity)
            .where(farm_activities: { start_date: start_date..end_date })
            .sum("COALESCE(activity_materials.actual_quantity, activity_materials.planned_quantity)")
          
          # Chi phí kỳ trước
          previous_query = ::Models::Farming::ActivityMaterial
            .joins(:farm_material)
            .joins(:farm_activity)
          
          if filters[:field_id].present?
            previous_query = previous_query.where(farm_activities: { field_id: filters[:field_id] })
          end
          
          if filters[:crop_id].present?
            previous_query = previous_query.where(farm_activities: { crop_animal_id: filters[:crop_id] })
          end
          
          previous_usage = previous_query
            .where(farm_activities: { start_date: previous_start..previous_end })
            .sum("COALESCE(activity_materials.actual_quantity, activity_materials.planned_quantity)")
          
          # Tính % thay đổi
          if previous_usage > 0
            cost_change = ((current_usage - previous_usage) / previous_usage * 100).round(2)
          else
            cost_change = current_usage > 0 ? 100 : 0
          end
          
          { cost_change: cost_change }
        else
          { cost_change: 0 }
        end
      end
    end
  end
end