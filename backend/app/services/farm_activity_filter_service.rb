class FarmActivityFilterService
  def initialize(activities, start_date, end_date)
    @activities = activities
    @start_date = start_date
    @end_date = end_date
  end

  def filter
    return @activities unless @start_date.present? && @end_date.present?

    start_date = Date.parse(@start_date) rescue nil
    end_date = Date.parse(@end_date) rescue nil

    if start_date && end_date
      @activities.where("start_date >= ? AND end_date <= ?", start_date, end_date)
    else
      raise ArgumentError, "Invalid date format"
    end
  end
end
