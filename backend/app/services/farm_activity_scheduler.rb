class FarmActivityScheduler
  def initialize(start_date, frequency)
    @start_date = start_date
    @frequency = frequency
  end

  def suggest_schedule
    schedule = []
    current_date = @start_date
    10.times do
      schedule << current_date
      current_date += @frequency.days
    end
    schedule
  end
end
