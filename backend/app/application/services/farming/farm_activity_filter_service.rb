module Services::Farming
  class FarmActivityFilterService
    def initialize(activities, start_date, end_date, activity_type = nil, crop_animal_id = nil, status = nil)
      @activities = activities
      @start_date = start_date
      @end_date = end_date
      @activity_type = activity_type
      @crop_animal_id = crop_animal_id
      @status = status
    end

    def filter
      result = @activities

      # Lọc theo ngày
      if @start_date.present? && @end_date.present?
        start_date = Date.parse(@start_date) rescue nil
        end_date = Date.parse(@end_date) rescue nil

        if start_date && end_date
          result = result.where("start_date >= ? AND end_date <= ?", start_date, end_date)
        else
          raise ArgumentError, "Invalid date format"
        end
      end

      # Lọc theo loại hoạt động
      result = result.where(activity_type: @activity_type) if @activity_type.present?

      # Lọc theo crop_animal_id
      result = result.where(crop_animal_id: @crop_animal_id) if @crop_animal_id.present?

      # Lọc theo trạng thái
      result = result.where(status: @status) if @status.present?

      result
    end
  end
end
