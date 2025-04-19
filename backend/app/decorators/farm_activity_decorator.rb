class FarmActivityDecorator
  def initialize(farm_activity)
    @farm_activity = farm_activity
  end

  def formatted_start_date
    @farm_activity.start_date.strftime("%d-%m-%Y")
  end

  def formatted_end_date
    @farm_activity.end_date.strftime("%d-%m-%Y")
  end

  def status_label
    if @farm_activity.end_date < Date.today
      "Overdue"
    elsif (@farm_activity.start_date - Date.today).to_i <= 3
      "Starting Soon"
    elsif (@farm_activity.end_date - Date.today).to_i <= 3
      "Ending Soon"
    else
      "On Track"
    end
  end
end
