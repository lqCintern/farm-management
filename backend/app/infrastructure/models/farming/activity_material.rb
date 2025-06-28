module Models::Farming
  class ActivityMaterial < Models::ApplicationRecord
    # Cập nhật associations với namespace mới
    belongs_to :farm_activity, class_name: "Farming::FarmActivity"
    belongs_to :farm_material, class_name: "Farming::FarmMaterial"

    # Validation
    validates :planned_quantity, presence: true, numericality: { greater_than: 0 }
    validates :actual_quantity, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

    # Callbacks
    after_create :reserve_material
    after_update :handle_quantity_changes
    after_destroy :release_material
    after_update :handle_activity_status_change, if: :saved_change_to_farm_activity_status?

    # Reserve vật tư khi tạo activity material
    def reserve_material
      return unless farm_material && planned_quantity
      
      # Bỏ qua reserve nếu có flag skip_reserve
      return if @skip_reserve
      
      # Chỉ reserve nếu activity chưa hoàn thành
      return if farm_activity&.status == "completed"
      
      unless farm_material.reserve_quantity(planned_quantity)
        errors.add(:base, "Không đủ vật tư #{farm_material.name} trong kho")
        throw(:abort)
      end
    end

    # Setter để bỏ qua reserve
    def skip_reserve=(value)
      @skip_reserve = value
    end

    # Xử lý thay đổi số lượng
    def handle_quantity_changes
      return unless saved_change_to_planned_quantity?
      
      old_quantity = saved_change_to_planned_quantity[0] || 0
      new_quantity = planned_quantity
      
      # Chỉ xử lý nếu activity chưa hoàn thành
      return if farm_activity&.status == "completed"
      
      if new_quantity > old_quantity
        # Cần reserve thêm
        additional = new_quantity - old_quantity
        unless farm_material.reserve_quantity(additional)
          errors.add(:base, "Không đủ vật tư #{farm_material.name} để tăng số lượng")
          throw(:abort)
        end
      elsif new_quantity < old_quantity
        # Giảm số lượng, release phần dư
        reduced = old_quantity - new_quantity
        farm_material.release_reserved_quantity(reduced)
      end
    end

    # Xử lý khi activity status thay đổi
    def handle_activity_status_change
      return unless farm_material
      
      case farm_activity.status
      when "completed"
        # Khi hoàn thành, tính toán lại reserved quantity
        recalculate_reserved_after_completion
      when "cancelled"
        # Khi hủy, release toàn bộ
        farm_material.release_reserved_quantity(planned_quantity)
      when "pending"
        # Khi chuyển về pending, reserve lại theo planned
        farm_material.reserve_quantity(planned_quantity)
      end
    end

    # Tính toán lại reserved quantity sau khi hoàn thành
    def recalculate_reserved_after_completion
      return unless farm_material && actual_quantity.present?
      
      # Commit actual_quantity (trừ kho thật)
      farm_material.commit_quantity(actual_quantity)
      
      # Release phần dư nếu actual < planned
      if actual_quantity < planned_quantity
        difference = planned_quantity - actual_quantity
        farm_material.release_reserved_quantity(difference)
      elsif actual_quantity > planned_quantity
        # Nếu actual > planned, cần commit thêm phần chênh lệch
        # (đã được xử lý ở trên với commit_quantity(actual_quantity))
        # Chỉ cần release planned_quantity đã reserve
        farm_material.release_reserved_quantity(planned_quantity)
      else
        # actual = planned, chỉ cần release planned_quantity
        farm_material.release_reserved_quantity(planned_quantity)
      end
    end

    # Release vật tư khi xóa activity material
    def release_material
      return unless farm_material && planned_quantity
      
      # Chỉ release nếu activity chưa hoàn thành
      return if farm_activity&.status == "completed"
      
      farm_material.release_reserved_quantity(planned_quantity)
    end

    # Commit vật tư khi bắt đầu thực hiện hoạt động
    def commit_material
      return unless farm_material && planned_quantity
      
      unless farm_material.commit_quantity(planned_quantity)
        errors.add(:base, "Không đủ vật tư #{farm_material.name} để thực hiện")
        return false
      end
      true
    end

    # Cập nhật actual quantity và xử lý chênh lệch
    def update_actual_quantity(actual_qty)
      return unless farm_material
      
      old_actual = actual_quantity || 0
      self.actual_quantity = actual_qty
      
      # Chỉ xử lý chênh lệch nếu activity đã completed và có thay đổi actual_quantity
      if farm_activity&.status == "completed" && actual_qty != old_actual
        # Xử lý chênh lệch giữa actual mới và actual cũ
        if actual_qty > old_actual
          # Dùng nhiều hơn, cần trừ thêm
          additional = actual_qty - old_actual
          unless farm_material.commit_quantity(additional)
            errors.add(:base, "Không đủ vật tư #{farm_material.name} để cập nhật số lượng thực tế")
            return false
          end
        elsif actual_qty < old_actual
          # Dùng ít hơn, hoàn trả phần dư
          returned = old_actual - actual_qty
          farm_material.return_quantity(returned)
        end
      end
      
      save
    end

    # Kiểm tra có thể commit không
    def can_commit?
      farm_material&.has_enough?(planned_quantity) || false
    end

    private

    def saved_change_to_farm_activity_status?
      farm_activity&.saved_change_to_status?
    end
  end
end
