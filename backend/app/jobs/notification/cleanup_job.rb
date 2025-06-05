# app/jobs/notification/cleanup_job.rb
module NotificationJob
  class CleanupJob < ApplicationJob
    queue_as :notifications

    def perform
      # Xóa các thông báo cũ đã đọc (trên 3 tháng)
      three_months_ago = 3.months.ago

      Notification.where("read_at IS NOT NULL AND read_at < ?", three_months_ago)
                  .delete_all
    end
  end
end
