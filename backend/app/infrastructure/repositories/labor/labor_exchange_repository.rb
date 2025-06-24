module Repositories
  module Labor
    class LaborExchangeRepository
      include ::Interfaces::Repositories::Labor::LaborExchangeRepositoryInterface

      def find(id)
        record = ::Models::Labor::LaborExchange.includes(:household_a, :household_b).find_by(id: id)
        return { success: false, errors: [ "Không tìm thấy giao dịch đổi công" ] } unless record

        { success: true, exchange: map_to_entity(record) }
      end

      def find_for_household(household_id)
        exchanges = ::Models::Labor::LaborExchange.where("household_a_id = ? OR household_b_id = ?", household_id, household_id)
                                         .includes(:household_a, :household_b)

        exchanges.map { |record| map_to_entity(record) }
      end

      def find_by_households(household_a_id, household_b_id)
        exchange = ::Models::Labor::LaborExchange.find_by_households(household_a_id, household_b_id)
        return { success: false, errors: [ "Không tìm thấy giao dịch đổi công giữa hai hộ" ] } unless exchange

        { success: true, exchange: map_to_entity(exchange) }
      end

      def find_or_create_between(household_a_id, household_b_id)
        # Sort IDs for consistency
        if household_a_id > household_b_id
          household_a_id, household_b_id = household_b_id, household_a_id
        end

        # First try to find an existing exchange
        exchange = ::Models::Labor::LaborExchange.find_by(household_a_id: household_a_id, household_b_id: household_b_id)

        unless exchange
          # Create a new exchange if none exists
          exchange = ::Models::Labor::LaborExchange.new(
            household_a_id: household_a_id,
            household_b_id: household_b_id,
            hours_balance: 0.0,
            last_transaction_date: Time.current
          )

          unless exchange.save
            return { success: false, errors: exchange.errors.full_messages }
          end
        end

        { success: true, exchange: map_to_entity(exchange) }
      end

      def update_balance(exchange_id, new_balance, transaction_description = nil)
        exchange = ::Models::Labor::LaborExchange.find_by(id: exchange_id)
        return { success: false, errors: [ "Không tìm thấy giao dịch đổi công" ] } unless exchange

        old_balance = exchange.hours_balance
        exchange.hours_balance = new_balance
        exchange.last_transaction_date = Time.current

        if exchange.save
          # Create transaction record if description is provided
          if transaction_description
            transaction = ::Models::Labor::LaborExchangeTransaction.create(
              labor_exchange_id: exchange_id,
              hours: new_balance - old_balance,
              description: transaction_description
            )

            unless transaction.persisted?
              return {
                success: false,
                errors: [ "Cập nhật số dư thành công nhưng không thể tạo ghi chép giao dịch" ]
              }
            end
          end

          { success: true, exchange: map_to_entity(exchange), difference: new_balance - old_balance }
        else
          { success: false, errors: exchange.errors.full_messages }
        end
      end

      def reset_balance(exchange_id)
        exchange = ::Models::Labor::LaborExchange.find_by(id: exchange_id)
        return { success: false, errors: [ "Không tìm thấy giao dịch đổi công" ] } unless exchange

        old_balance = exchange.hours_balance

        ActiveRecord::Base.transaction do
          # Reset balance
          exchange.hours_balance = 0.0
          exchange.last_transaction_date = Time.current
          exchange.save!

          # Create transaction record
          transaction = ::Models::Labor::LaborExchangeTransaction.create!(
            labor_exchange_id: exchange_id,
            hours: -old_balance,
            description: "Đã reset công nợ giữa hai hộ"
          )

          {
            success: true,
            exchange: map_to_entity(exchange),
            transaction: {
              id: transaction.id,
              hours: transaction.hours,
              description: transaction.description,
              created_at: transaction.created_at
            }
          }
        end
      rescue => e
        { success: false, errors: [ "Lỗi khi reset công nợ: #{e.message}" ] }
      end

      def get_transactions(exchange_id, options = {})
        exchange = ::Models::Labor::LaborExchange.find_by(id: exchange_id)
        return { success: false, errors: [ "Không tìm thấy giao dịch đổi công" ] } unless exchange

        page = options[:page] || 1
        per_page = options[:per_page] || 20

        # Sử dụng Pagy thay vì per()
        pagy = Pagy.new(count: Models::Labor::LaborExchangeTransaction.where(labor_exchange_id: exchange_id).count,
                       page: page,
                       items: per_page)

        transactions = ::Models::Labor::LaborExchangeTransaction
          .where(labor_exchange_id: exchange_id)
          .includes(labor_assignment: [ :worker, :labor_request ])
          .order(created_at: :desc)
          .offset(pagy.offset)
          .limit(pagy.limit)  # Thay đổi: sử dụng limit thay vì items

        {
          success: true,
          transactions: transactions.map { |t| map_transaction_to_entity(t) },
          total: pagy.count,
          pagination: {
            current_page: pagy.page,
            per_page: pagy.limit,  # Thay đổi: sử dụng limit thay vì items
            total_pages: pagy.last  # Thay đổi: sử dụng last thay vì pages
          }
        }
      end

      def add_transaction(exchange_id, hours, description, assignment_id = nil)
        exchange = ::Models::Labor::LaborExchange.find_by(id: exchange_id)
        return { success: false, errors: [ "Không tìm thấy giao dịch đổi công" ] } unless exchange

        ActiveRecord::Base.transaction do
          # Update balance
          exchange.hours_balance += hours
          exchange.last_transaction_date = Time.current
          exchange.save!

          # Create transaction record
          transaction = ::Models::Labor::LaborExchangeTransaction.new(
            labor_exchange_id: exchange_id,
            labor_assignment_id: assignment_id,
            hours: hours,
            description: description
          )

          unless transaction.save
            raise ActiveRecord::Rollback
            return { success: false, errors: transaction.errors.full_messages }
          end

          {
            success: true,
            exchange: map_to_entity(exchange),
            transaction: map_transaction_to_entity(transaction)
          }
        end
      rescue => e
        { success: false, errors: [ "Lỗi khi thêm giao dịch: #{e.message}" ] }
      end

      def process_assignment(assignment_id)
        assignment = ::Models::Labor::LaborAssignment.includes(:labor_request, :worker, :home_household).find_by(id: assignment_id)
        return { success: false, errors: [ "Không tìm thấy phân công lao động" ] } unless assignment

        # Only process exchange or mixed request types
        request_type = assignment.labor_request.request_type
        return { success: true, message: "Không phải yêu cầu đổi công" } unless [ "exchange", "mixed" ].include?(request_type)

        # Check if already processed
        if assignment.respond_to?(:exchange_processed) && assignment.exchange_processed
          return { success: true, message: "Phân công này đã được xử lý trước đó" }
        end

        # Need valid work hours
        if assignment.hours_worked.blank? || assignment.hours_worked <= 0
          return { success: false, errors: [ "Số giờ làm việc không hợp lệ" ] }
        end

        worker_household_id = assignment.home_household_id
        requesting_household_id = assignment.labor_request.requesting_household_id

        # Find or create labor_exchange
        result = find_or_create_between(worker_household_id, requesting_household_id)
        return result unless result[:success]

        exchange = ::Models::Labor::LaborExchange.find(result[:exchange].id)

        # Calculate hours: if worker from household_b works for household_a, balance increases
        # If worker from household_a works for household_b, balance decreases
        if worker_household_id == exchange.household_b_id && requesting_household_id == exchange.household_a_id
          hours = assignment.hours_worked
        elsif worker_household_id == exchange.household_a_id && requesting_household_id == exchange.household_b_id
          hours = -assignment.hours_worked
        else
          return { success: false, errors: [ "Không thể xác định hướng giao dịch" ] }
        end

        ActiveRecord::Base.transaction do
          # Update balance
          exchange.hours_balance += hours
          exchange.last_transaction_date = Time.current
          exchange.save!

          # Create transaction record
          description = "Công từ #{assignment.worker.fullname} ngày #{assignment.work_date}"
          transaction = ::Models::Labor::LaborExchangeTransaction.create!(
            labor_exchange_id: exchange.id,
            labor_assignment_id: assignment.id,
            hours: hours,
            description: description
          )

          # Mark assignment as processed if field exists
          if assignment.respond_to?(:exchange_processed)
            assignment.update_column(:exchange_processed, true)
          end

          {
            success: true,
            exchange: map_to_entity(exchange),
            transaction: map_transaction_to_entity(transaction)
          }
        end
      rescue => e
        { success: false, errors: [ "Lỗi khi xử lý phân công: #{e.message}" ] }
      end

      def recalculate_balance(household_a_id, household_b_id)
        result = {
          success: false,
          errors: [],
          old_balance: 0,
          new_balance: 0,
          diff: 0
        }

        # Find or create exchange
        exchange_result = find_or_create_between(household_a_id, household_b_id)
        return { success: false, errors: exchange_result[:errors] } unless exchange_result[:success]

        exchange = ::Models::Labor::LaborExchange.find(exchange_result[:exchange].id)
        result[:old_balance] = exchange.hours_balance

        ActiveRecord::Base.transaction do
          # Delete all existing transactions
          exchange.transactions.delete_all

          # Reset balance
          exchange.hours_balance = 0

          # Find all completed assignments between these households
          completed_assignments = ::Models::Labor::LaborAssignment.includes(:labor_request, :worker)
            .where(status: :completed)
            .where("hours_worked > 0 OR work_units > 0")
            .where(
              "home_household_id IN (?, ?) AND labor_requests.requesting_household_id IN (?, ?)",
              household_a_id, household_b_id, household_a_id, household_b_id
            )
            .where("labor_requests.request_type IN (?)", [ "exchange", "mixed" ])
            .references(:labor_request)
            .order(work_date: :asc, created_at: :asc)

          # Recalculate balance based on assignments
          completed_assignments.each do |assignment|
            # Skip if not directly related to these households
            next unless (assignment.home_household_id == household_a_id || assignment.home_household_id == household_b_id) &&
                       (assignment.labor_request.requesting_household_id == household_a_id ||
                        assignment.labor_request.requesting_household_id == household_b_id)

            # Use work_units if available, otherwise calculate from hours_worked
            units = assignment.work_units.present? && assignment.work_units > 0 ?
                    assignment.work_units :
                    (assignment.hours_worked >= 6 ? 1.0 : 0.5)

            # Calculate hours based on household roles
            if assignment.home_household_id == household_b_id && assignment.labor_request.requesting_household_id == household_a_id
              hours = units  # B works for A → A owes B → B's balance increases
            elsif assignment.home_household_id == household_a_id && assignment.labor_request.requesting_household_id == household_b_id
              hours = -units  # A works for B → B owes A → A's balance increases
            end

            # Update balance
            exchange.hours_balance += hours

            # Create transaction record
            worker_name = assignment.worker&.fullname || "Worker"
            description = "Recalculated: Work by #{worker_name} on #{assignment.work_date}"

            ::Labor::LaborExchangeTransaction.create!(
              labor_exchange_id: exchange.id,
              labor_assignment_id: assignment.id,
              hours: hours,
              description: description
            )

            # Mark assignment as processed if field exists
            if assignment.respond_to?(:exchange_processed)
              assignment.update_column(:exchange_processed, true)
            end
          end

          exchange.last_transaction_date = Time.current
          exchange.save!

          result[:new_balance] = exchange.hours_balance
          result[:diff] = result[:new_balance] - result[:old_balance]
          result[:success] = true
          result[:exchange] = map_to_entity(exchange)
        end
      rescue => e
        result[:errors] << "Lỗi khi tính toán lại số dư: #{e.message}"
      end

      def delete_all_transactions(exchange_id)
        exchange = ::Models::Labor::LaborExchange.find_by(id: exchange_id)
        return { success: false, errors: [ "Không tìm thấy giao dịch đổi công" ] } unless exchange

        count = exchange.transactions.count

        ActiveRecord::Base.transaction do
          exchange.transactions.delete_all
          exchange.hours_balance = 0
          exchange.save!

          { success: true, message: "Đã xóa #{count} giao dịch", exchange: map_to_entity(exchange) }
        end
      rescue => e
        { success: false, errors: [ "Lỗi khi xóa giao dịch: #{e.message}" ] }
      end

      private

      def map_to_entity(record)
        Entities::Labor::LaborExchange.new(
          id: record.id,
          household_a_id: record.household_a_id,
          household_b_id: record.household_b_id,
          hours_balance: record.hours_balance,
          last_transaction_date: record.last_transaction_date,
          created_at: record.created_at,
          updated_at: record.updated_at,
          household_a_name: record.household_a&.name,
          household_b_name: record.household_b&.name
        )
      end

      def map_transaction_to_entity(transaction)
        exchange = transaction.labor_exchange
        assignment_data = nil
        direction_info = {}

        # Xác định thông tin người lao động và yêu cầu nếu có
        if transaction.labor_assignment_id.present?
          assignment = transaction.labor_assignment
          worker = assignment&.worker
          request = assignment&.labor_request

          if assignment && request
            # Xác định hướng giao dịch và vai trò
            requesting_household = request.requesting_household
            providing_household = request.providing_household

            direction_info = {
              requesting_household_id: requesting_household&.id,
              requesting_household_name: requesting_household&.name,
              providing_household_id: providing_household&.id,
              providing_household_name: providing_household&.name,
              exchange_direction: requesting_household&.id == exchange.household_a_id ? "a_requested" : "b_requested"
            }

            # Chi tiết assignment
            assignment_data = {
              worker_name: worker&.user_name || "Người lao động không xác định",
              work_date: assignment.work_date.to_s,
              hours_worked: assignment.hours_worked.to_s,
              request_title: request.title || "Không có tiêu đề"
            }
          end
        end

        # Tạo entity transaction với đầy đủ thông tin
        transaction_entity = Entities::Labor::LaborExchangeTransaction.new(
          id: transaction.id,
          labor_exchange_id: transaction.labor_exchange_id,
          labor_assignment_id: transaction.labor_assignment_id,
          hours: transaction.hours.to_s,
          description: transaction.description,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
          worker_name: assignment_data&.dig(:worker_name),
          work_date: assignment_data&.dig(:work_date),
          assignment_details: assignment_data
        )

        # Thêm thông tin direction vào object để frontend sử dụng
        transaction_entity.instance_variable_set(:@direction_info, direction_info)
        def transaction_entity.direction_info; @direction_info; end

        transaction_entity
      end
    end
  end
end
