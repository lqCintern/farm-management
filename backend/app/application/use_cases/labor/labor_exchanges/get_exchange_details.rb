module UseCases::Labor
  module LaborExchanges
    class GetExchangeDetails
      def initialize(exchange_repository)
        @exchange_repository = exchange_repository
      end

      def execute(exchange_id, household_id)
        # Tìm exchange theo id
        exchange_result = @exchange_repository.find(exchange_id)
        return { success: false, errors: exchange_result[:errors] } unless exchange_result[:success]

        exchange = exchange_result[:exchange]
        balance = exchange.balance_for(household_id)

        # Xác định hướng số dư
        direction = if balance > 0
                      "positive"
                    elsif balance < 0
                      "negative"
                    else
                      "neutral"
                    end

        # Lấy thông tin household partner
        partner_id = exchange.partner_household_id(household_id)
        partner_name = exchange.partner_household_name(household_id)

        # Lấy lịch sử giao dịch gần đây
        transactions_result = @exchange_repository.get_transactions(exchange.id, { page: 1, per_page: 5 })

        # Tạo danh sách transactions với thông tin phong phú
        enriched_transactions = transactions_result[:transactions].map do |tx|
          # Xác định vai trò của current household trong giao dịch này
          is_requester = tx.direction_info&.dig(:requesting_household_id) == household_id
          is_provider = tx.direction_info&.dig(:providing_household_id) == household_id

          # Tạo mô tả dễ đọc
          readable_description = if tx.labor_assignment_id.present?
            worker = tx.worker_name || "Người lao động"
            date = tx.work_date ? Date.parse(tx.work_date).strftime("%d/%m/%Y") : "ngày không xác định"

            if is_requester
              "Bạn đã nhận #{tx.hours} giờ công từ #{worker} vào #{date}"
            else
              "#{worker} đã cung cấp #{tx.hours} giờ công cho hộ #{tx.direction_info&.dig(:requesting_household_name)} vào #{date}"
            end
          else
            tx.description
          end

          # Thêm các thuộc tính bổ sung
          tx.instance_variable_set(:@readable_description, readable_description)
          tx.instance_variable_set(:@transaction_role, is_requester ? "requester" : (is_provider ? "provider" : "other"))
          def tx.readable_description; @readable_description; end
          def tx.transaction_role; @transaction_role; end

          tx
        end

        # Đóng gói response
        {
          success: true,
          data: {
            exchange: {
              id: exchange.id,
              household_a_id: exchange.household_a_id,
              household_b_id: exchange.household_b_id,
              household_a_name: exchange.household_a_name,
              household_b_name: exchange.household_b_name,
              balance: balance.to_s,
              last_transaction_date: exchange.last_transaction_date
            },
            balance: balance,
            direction: direction,
            partner_name: partner_name,
            transactions: enriched_transactions,
            detailed_history: []
          }
        }
      end
    end
  end
end
