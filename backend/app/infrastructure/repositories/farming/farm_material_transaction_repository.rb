module Repositories
  module Farming
    class FarmMaterialTransactionRepository
      def find_by_material_id(material_id, user_id = nil)
        query = ::Models::Farming::FarmMaterialTransaction.where(farm_material_id: material_id)
        query = query.where(user_id: user_id) if user_id
        query.order(created_at: :desc).includes(:source)
      end

      def create_transaction(attributes)
        # Xử lý source nếu là đối tượng
        if attributes[:source].present? && !attributes[:source].is_a?(String)
          attributes[:source_type] ||= attributes[:source].class.name.demodulize
          attributes[:source_id] ||= attributes[:source].id
          attributes.delete(:source)  # Xóa source để tránh lỗi
        end
        
        transaction = ::Models::Farming::FarmMaterialTransaction.create!(attributes)
        { success: true, data: transaction }
      rescue => e
        Rails.logger.error("Lỗi tạo giao dịch: #{e.message}")
        { success: false, error: e.message }
      end
      
      def map_transactions_to_dto(transactions)
        transactions.map do |transaction|
          source_info = case transaction.source_type
                        when "Models::SupplyChain::SupplyOrder"
                          order = transaction.source
                          {
                            source_type: "Đơn mua vật tư",
                            source_id: order&.id,
                            supplier: order.supplier.user_name || "Không xác định",
                            date: transaction.created_at
                          }
                        when "Models::Farming::FarmActivity"
                          activity = transaction.source
                          {
                            source_type: "Hoạt động nông trại",
                            source_id: activity&.id,
                            activity_name: activity&.description,
                            activity_type: activity&.activity_type,
                            date: activity&.actual_completion_date || activity&.end_date || transaction.created_at
                          }
                        else
                          {
                            source_type: "Điều chỉnh thủ công",
                            date: transaction.created_at
                          }
                        end

          {
            id: transaction.id,
            quantity: transaction.quantity,
            unit_price: transaction.unit_price,
            total_price: transaction.total_price,
            transaction_type: transaction.transaction_type,
            notes: transaction.notes,
            created_at: transaction.created_at,
            source: source_info
          }
        end
      end
    end
  end
end