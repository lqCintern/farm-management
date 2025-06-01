class FarmActivityStatsService
  def initialize(activities, period = "month", year = Date.today.year, month = Date.today.month, quarter = nil)
    @activities = activities
    @period = period.to_s

    # Chuyển đổi các tham số thành số
    @year = year.to_i
    @month = month.to_i if month.present?
    @quarter = quarter.present? ? quarter.to_i : ((Date.today.month - 1) / 3 + 1)

    # Đảm bảo các giá trị mặc định hợp lệ
    @year = Date.today.year if @year.nil? || @year <= 0
    @month = Date.today.month if @month.nil? || @month <= 0 || @month > 12
    @quarter = ((Date.today.month - 1) / 3 + 1) if @quarter.nil? || @quarter <= 0 || @quarter > 4
  end

  def generate_stats
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

    activities = @activities.where(start_date: start_date..end_date)

    generate_activity_type_counts(activities, "Tháng #{@month}/#{@year}")
  end

  def quarterly_stats
    start_month = (@quarter - 1) * 3 + 1
    start_date = Date.new(@year, start_month, 1)
    end_date = start_date.end_of_month.advance(months: 2)

    activities = @activities.where(start_date: start_date..end_date)

    generate_activity_type_counts(activities, "Quý #{@quarter}/#{@year}")
  end

  def yearly_stats
    start_date = Date.new(@year, 1, 1)
    end_date = Date.new(@year, 12, 31)

    activities = @activities.where(start_date: start_date..end_date)

    generate_activity_type_counts(activities, "Năm #{@year}")
  end

  def generate_activity_type_counts(activities, period_label)
    # Đếm số lượng theo loại hoạt động
    counts_by_type = activities.group(:activity_type).count

    # Đếm số lượng theo trạng thái
    status_counts = activities.group(:status).count

    # Tính tỷ lệ hoàn thành
    total = activities.count
    completed = activities.where(status: :completed).count
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
