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
    
    def self.get_transaction_history(household_a_id, household_b_id, options = {})
      exchange = Labor::LaborExchange.find_by_household_ids(household_a_id, household_b_id)
      return { success: false, errors: ["Không tìm thấy giao dịch giữa hai hộ"] } unless exchange
      
      transactions = exchange.transactions
        .order(created_at: :desc)
        .limit(options[:limit] || 50)
        .offset(options[:offset] || 0)
      
      { success: true, transactions: transactions, total: exchange.transactions.count }
    end
    
    def self.manual_adjust_balance(household_a_id, household_b_id, hours, notes)
      exchange = Labor::LaborExchange.find_by_household_ids(household_a_id, household_b_id)
      return { success: false, errors: ["Không tìm thấy giao dịch giữa hai hộ"] } unless exchange
      
      transaction = Labor::LaborExchangeTransaction.new(
        labor_exchange: exchange,
        hours: hours,
        description: "Điều chỉnh thủ công: #{notes}"
      )
      
      if transaction.save
        exchange.hours_balance += hours
        exchange.last_transaction_date = Time.current
        exchange.save
        
        { success: true, exchange: exchange, transaction: transaction }
      else
        { success: false, errors: transaction.errors.full_messages }
      end
    end
    
    def self.recalculate_balance(household_a_id, household_b_id)
      result = { success: false, errors: [], old_balance: 0, new_balance: 0 }
      
      # Tìm hoặc tạo labor_exchange
      exchange = Labor::LaborExchange.find_or_create_between(household_a_id, household_b_id)
      result[:old_balance] = exchange.hours_balance
      
      # Lưu tất cả giao dịch hiện có để lịch sử
      old_transactions = exchange.transactions.to_a
      
      begin
        Labor::LaborExchange.transaction do
          # Reset balance và xóa tất cả transactions hiện có
          exchange.hours_balance = 0
          exchange.transactions.delete_all
          
          # Tìm tất cả assignments đã hoàn thành liên quan đến hai hộ
          completed_assignments = Labor::LaborAssignment.includes(:labor_request)
            .where(status: :completed)
            .where('hours_worked > 0 OR work_units > 0')
            .where(
              'home_household_id IN (?, ?) AND labor_requests.requesting_household_id IN (?, ?)',
              household_a_id, household_b_id, household_a_id, household_b_id
            )
            .where(
              'labor_requests.request_type IN (?)', 
              ['exchange', 'mixed']
            )
            .references(:labor_request)
            .order(work_date: :asc, created_at: :asc)
          
          # Tạo lại các transactions và tính toán lại balance
          completed_assignments.each do |assignment|
            # Tự động tính hours_worked nếu không có giá trị
            if (assignment.hours_worked.blank? || assignment.hours_worked == 0) && 
               assignment.start_time.present? && assignment.end_time.present?
              
              hours_diff = ((assignment.end_time - assignment.start_time) / 3600).round(1)
              
              # Cập nhật hours_worked và work_units
              assignment.update_columns(
                hours_worked: hours_diff,
                work_units: hours_diff >= 6 ? 1.0 : 0.5
              )
              
              # Đánh dấu đã được xử lý
              assignment.update_column(:exchange_processed, true) if assignment.respond_to?(:exchange_processed)
            end
            
            # Bỏ qua nếu không liên quan trực tiếp đến hai hộ
            next unless (assignment.home_household_id == household_a_id || assignment.home_household_id == household_b_id) &&
                       (assignment.labor_request.requesting_household_id == household_a_id || 
                        assignment.labor_request.requesting_household_id == household_b_id)
            
            # Tính công (ưu tiên work_units nếu có, nếu không thì dùng hours_worked)
            units = assignment.work_units.present? && assignment.work_units > 0 ? 
                    assignment.work_units : 
                    (assignment.hours_worked >= 6 ? 1.0 : 0.5)
            
            # Tính toán giờ công: nếu worker từ household_b làm việc cho household_a, balance tăng
            # Nếu worker từ household_a làm việc cho household_b, balance giảm
            if assignment.home_household_id == household_b_id && assignment.labor_request.requesting_household_id == household_a_id
              hours = units
            elsif assignment.home_household_id == household_a_id && assignment.labor_request.requesting_household_id == household_b_id
              hours = -units
            else
              next # Bỏ qua nếu không xác định được hướng
            end
            
            # Cập nhật balance
            exchange.hours_balance += hours
            
            # Tạo transaction mới
            transaction = Labor::LaborExchangeTransaction.create!(
              labor_exchange: exchange,
              labor_assignment_id: assignment.id,
              hours: hours,
              description: "Tính lại: Công từ #{assignment.worker&.fullname || 'Worker'} ngày #{assignment.work_date}"
            )
            
            # Đánh dấu assignment đã được xử lý
            assignment.update_column(:exchange_processed, true) if assignment.respond_to?(:exchange_processed)
          end
          
          exchange.last_transaction_date = Time.current
          exchange.save!
          
          result[:new_balance] = exchange.hours_balance
          result[:success] = true
          result[:exchange] = exchange
          result[:diff] = result[:new_balance] - result[:old_balance]
        end
      rescue => e
        result[:errors] << "Lỗi khi tính toán lại số dư: #{e.message}"
      end
      
      result
    end
  end
end