module Farming
  module Services
    class FarmActivityStatsService
    def generate_stats(activities, period = "month", year = Date.today.year, month = Date.today.month, quarter = nil)
      @activities = activities
      @period = period.to_s

      # Chuyển đổi các tham số
      @year = year.to_i
      @month = month.to_i if month.present?
      @quarter = quarter.present? ? quarter.to_i : ((Date.today.month - 1) / 3 + 1)

      # Đảm bảo các giá trị mặc định
      @year = Date.today.year if @year.nil? || @year <= 0
      @month = Date.today.month if @month.nil? || @month <= 0 || @month > 12
      @quarter = ((Date.today.month - 1) / 3 + 1) if @quarter.nil? || @quarter <= 0 || @quarter > 4

      case @period
      when "month"
        monthly_stats
      when "quarter"
        quarterly_stats
      when "year"
        yearly_stats
      else
        monthly_stats
      end
    end

    private

    def monthly_stats
      start_date = Date.new(@year, @month, 1)
      end_date = start_date.end_of_month

      filtered_activities = filter_by_date_range(@activities, start_date, end_date)
      generate_activity_type_counts(filtered_activities, "Tháng #{@month}/#{@year}")
    end

    def quarterly_stats
      start_month = (@quarter - 1) * 3 + 1
      start_date = Date.new(@year, start_month, 1)
      end_date = start_date.end_of_month.advance(months: 2)

      filtered_activities = filter_by_date_range(@activities, start_date, end_date)
      generate_activity_type_counts(filtered_activities, "Quý #{@quarter}/#{@year}")
    end

    def yearly_stats
      start_date = Date.new(@year, 1, 1)
      end_date = Date.new(@year, 12, 31)

      filtered_activities = filter_by_date_range(@activities, start_date, end_date)
      generate_activity_type_counts(filtered_activities, "Năm #{@year}")
    end

    def filter_by_date_range(activities, start_date, end_date)
      activities.select do |activity|
        activity.start_date && activity.start_date.between?(start_date, end_date)
      end
    end

    def generate_activity_type_counts(activities, period_label)
      # Đếm số lượng theo loại hoạt động
      counts_by_type = {}
      activities.each do |activity|
        counts_by_type[activity.activity_type] ||= 0
        counts_by_type[activity.activity_type] += 1
      end

      # Đếm số lượng theo trạng thái
      status_counts = {}
      activities.each do |activity|
        status_counts[activity.status] ||= 0
        status_counts[activity.status] += 1
      end

      # Tính tỷ lệ hoàn thành
      total = activities.size
      completed = activities.count { |a| a.completed? }
      completion_rate = total > 0 ? (completed.to_f / total * 100).round(2) : 0

      {
        period: period_label,
        total_activities: total,
        by_activity_type: counts_by_type,
        by_status: status_counts,
        completion_rate: completion_rate
      }
    end
      end
  end
end