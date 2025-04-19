class FarmActivityStatusService
  def initialize(farm_activity)
    @farm_activity = farm_activity
  end

  def status_details
    {
      starting_soon: starting_soon?,
      ending_soon: ending_soon?,
      overdue: overdue?,
      overdue_days: overdue_days
    }
  end

  private

  def starting_soon?
    (@farm_activity.start_date - Date.today).to_i <= 3 && @farm_activity.start_date >= Date.today
  end

  def ending_soon?
    (@farm_activity.end_date - Date.today).to_i <= 3 && @farm_activity.end_date >= Date.today
  end

  def overdue?
    @farm_activity.end_date < Date.today
  end

  def overdue_days
    return 0 unless overdue?
    (Date.today - @farm_activity.end_date).to_i
  end
end
