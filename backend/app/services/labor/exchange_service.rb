# app/services/labor/exchange_service.rb
module Labor
  class ExchangeService
    def self.process_completed_assignment(assignment)
      result = { success: false, errors: [] }
      
      # Chỉ xử lý đổi công cho các yêu cầu exchange hoặc mixed
      request_type = assignment.labor_request.request_type.to_sym
      return { success: true, message: "Không phải yêu cầu đổi công" } unless [:exchange, :mixed].include?(request_type)
      
      # Cần có số giờ làm việc
      if assignment.hours_worked.blank? || assignment.hours_worked <= 0
        result[:errors] << "Số giờ làm việc không hợp lệ"
        return result
      end
      
      # Xác định hai hộ tham gia giao dịch
      worker_household_id = assignment.home_household_id
      requesting_household_id = assignment.labor_request.requesting_household_id
      
      # Tìm hoặc tạo labor_exchange
      exchange = Labor::LaborExchange.find_or_create_between(worker_household_id, requesting_household_id)
      
      begin
        Labor::LaborExchange.transaction do
          # Tính toán giờ công: nếu worker từ household_b làm việc cho household_a, balance tăng
          # Nếu worker từ household_a làm việc cho household_b, balance giảm
          if worker_household_id == exchange.household_b_id && requesting_household_id == exchange.household_a_id
            hours = assignment.hours_worked
          elsif worker_household_id == exchange.household_a_id && requesting_household_id == exchange.household_b_id
            hours = -assignment.hours_worked
          else
            result[:errors] << "Không thể xác định hướng giao dịch"
            raise ActiveRecord::Rollback
          end
          
          # Cập nhật balance
          exchange.hours_balance += hours
          exchange.last_transaction_date = Time.current
          
          # Lưu labor_exchange
          unless exchange.save
            result[:errors] += exchange.errors.full_messages
            raise ActiveRecord::Rollback
          end
          
          # Tạo giao dịch
          transaction = Labor::LaborExchangeTransaction.new(
            labor_exchange: exchange,
            labor_assignment_id: assignment.id,
            hours: hours,
            description: "Công từ #{assignment.worker.full_name} ngày #{assignment.work_date}"
          )
          
          unless transaction.save
            result[:errors] += transaction.errors.full_messages
            raise ActiveRecord::Rollback
          end
          
          result[:transaction] = transaction
          result[:success] = true
        end
      rescue => e
        result[:errors] << "Lỗi hệ thống: #{e.message}"
      end
      
      result
    end
    
    def self.get_household_exchanges(household_id)
      # Lấy tất cả giao dịch đổi công liên quan đến household
      exchanges = Labor::LaborExchange.where("household_a_id = ? OR household_b_id = ?", household_id, household_id)
                                     .includes(:household_a, :household_b)
      
      result = exchanges.map do |exchange|
        # Xác định hộ còn lại và tính balance từ góc nhìn của household hiện tại
        if exchange.household_a_id == household_id
          other_household = exchange.household_b
          balance = exchange.hours_balance
        else
          other_household = exchange.household_a
          balance = -exchange.hours_balance
        end
        
        {
          exchange_id: exchange.id,
          other_household: other_household,
          balance: balance,
          last_transaction_date: exchange.last_transaction_date
        }
      end
      
      result
    end
    
    def self.get_exchange_details(exchange_id, household_id)
      exchange = Labor::LaborExchange.find(exchange_id)
      
      # Kiểm tra quyền truy cập
      unless [exchange.household_a_id, exchange.household_b_id].include?(household_id)
        return { success: false, errors: ["Bạn không có quyền xem thông tin này"] }
      end
      
      # Lấy danh sách giao dịch
      transactions = exchange.transactions
                            .includes(labor_assignment: [:worker, :labor_request])
                            .order(created_at: :desc)
                            
      # Tính balance từ góc nhìn của household hiện tại
      if exchange.household_a_id == household_id
        balance = exchange.hours_balance
        direction = "original"
      else
        balance = -exchange.hours_balance
        direction = "reversed"
      end
      
      {
        success: true,
        exchange: exchange,
        balance: balance,
        direction: direction,
        transactions: transactions
      }
    end
    
    def self.reset_balance(exchange_id, requesting_household_id)
      exchange = Labor::LaborExchange.find(exchange_id)
      
      # Kiểm tra quyền truy cập
      unless [exchange.household_a_id, exchange.household_b_id].include?(requesting_household_id)
        return { success: false, errors: ["Bạn không có quyền thực hiện thao tác này"] }
      end
      
      begin
        Labor::LaborExchange.transaction do
          exchange.hours_balance = 0.0
          exchange.last_transaction_date = Time.current
          
          unless exchange.save
            return { success: false, errors: exchange.errors.full_messages }
          end
          
          # Tạo giao dịch reset
          transaction = Labor::LaborExchangeTransaction.new(
            labor_exchange: exchange,
            hours: 0,
            description: "Đã reset công nợ giữa hai hộ"
          )
          
          unless transaction.save
            return { success: false, errors: transaction.errors.full_messages }
          end
          
          { success: true, exchange: exchange, transaction: transaction }
        end
      rescue => e
        { success: false, errors: ["Lỗi hệ thống: #{e.message}"] }
      end
    end
  end
end