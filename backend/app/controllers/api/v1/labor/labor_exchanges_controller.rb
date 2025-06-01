# app/controllers/api/v1/labor/labor_exchanges_controller.rb
module Api
  module V1
    module Labor
      class LaborExchangesController < BaseController
        before_action :require_household
        before_action :set_labor_exchange, only: [ :show, :reset_balance ]

        def index
          @summaries = ::Labor::ExchangeService.get_household_exchanges(current_household.id)
          render_success_response(@summaries)
        end

        def show
          result = ::Labor::ExchangeService.get_exchange_details(
            @labor_exchange.id,
            current_household.id
          )

          if result[:success]
            render_success_response({
              exchange: result[:exchange],
              balance: result[:balance],
              direction: result[:direction],
              transactions: result[:transactions]
            })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def reset_balance
          result = ::Labor::ExchangeService.reset_balance(
            @labor_exchange.id,
            current_household.id
          )

          if result[:success]
            render_success_response(result[:exchange])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        # Lịch sử giao dịch đổi công giữa hai hộ
        def transaction_history
          household_b_id = params[:household_id].to_i
          page = params[:page].to_i || 1
          per_page = params[:per_page].to_i || 20

          result = ::Labor::ExchangeService.get_transaction_history(
            current_household.id,
            household_b_id,
            { page: page, per_page: per_page }
          )

          if result[:success]
            render_success_response({
              transactions: result[:transactions],
              total: result[:total],
              pagination: {
                page: page,
                per_page: per_page,
                total_pages: (result[:total].to_f / per_page).ceil
              }
            })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        # Điều chỉnh số dư công thủ công
        def adjust_balance
          household_b_id = params[:household_id].to_i
          hours = params[:hours].to_f
          notes = params[:notes]

          result = ::Labor::ExchangeService.manual_adjust_balance(
            current_household.id,
            household_b_id,
            hours,
            notes
          )

          if result[:success]
            render_success_response(result[:exchange])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def recalculate
          household_b_id = params[:household_id].to_i

          result = ::Labor::ExchangeService.recalculate_balance(
            current_household.id,
            household_b_id
          )

          if result[:success]
            render_success_response({
              exchange: result[:exchange],
              old_balance: result[:old_balance],
              new_balance: result[:new_balance],
              difference: result[:diff]
            })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def recalculate_all
          # Lấy danh sách tất cả các hộ có trao đổi công với hộ hiện tại
          exchanges = Labor::LaborExchange.where("household_a_id = ? OR household_b_id = ?",
                                                 current_household.id, current_household.id)

          results = []

          exchanges.each do |exchange|
            # Xác định household_b_id (hộ đối tác)
            partner_id = exchange.household_a_id == current_household.id ?
                         exchange.household_b_id : exchange.household_a_id

            # Tính lại số dư
            result = ::Labor::ExchangeService.recalculate_balance(
              current_household.id,
              partner_id
            )

            if result[:success]
              results << {
                household_id: partner_id,
                household_name: partner_id == exchange.household_a_id ?
                                exchange.household_a.name : exchange.household_b.name,
                old_balance: result[:old_balance],
                new_balance: result[:new_balance],
                difference: result[:diff]
              }
            end
          end

          render_success_response(results)
        end

        def initialize_exchanges
          # Tìm tất cả các hộ đã từng làm việc với nhau
          related_households = Set.new

          # Tìm qua assignments đã hoàn thành
          completed_assignments = ::Labor::LaborAssignment
            .joins(:labor_request)
            .where(status: :completed)
            .where("labor_requests.request_type IN (?)", [ "exchange", "mixed" ])
            .where("labor_requests.requesting_household_id = ? OR home_household_id = ?",
                   current_household.id, current_household.id)

          completed_assignments.each do |assignment|
            if assignment.labor_request.requesting_household_id == current_household.id
              related_households.add(assignment.home_household_id)
            elsif assignment.home_household_id == current_household.id
              related_households.add(assignment.labor_request.requesting_household_id)
            end
          end

          # Bỏ ID của chính hộ hiện tại
          related_households.delete(current_household.id)

          results = []

          # Tính toán đổi công cho từng cặp hộ
          related_households.each do |partner_id|
            result = ::Labor::ExchangeService.recalculate_balance(current_household.id, partner_id)

            if result[:success]
              partner = ::Labor::FarmHousehold.find_by(id: partner_id)
              results << {
                household_id: partner_id,
                household_name: partner&.name || "Hộ #{partner_id}",
                old_balance: result[:old_balance],
                new_balance: result[:new_balance],
                difference: result[:diff]
              }
            end
          end

          render_success_response(results)
        end

        # Xem thông tin đổi công giữa hai hộ
        def show_by_household
          household_b_id = params[:household_id].to_i

          # Tìm exchange giữa hai hộ
          exchange = ::Labor::LaborExchange.find_by_households(current_household.id, household_b_id)

          unless exchange
            render_error_response("Không tìm thấy thông tin đổi công giữa hai hộ", :not_found)
            return
          end

          result = ::Labor::ExchangeService.get_exchange_details(
            exchange.id,
            current_household.id
          )

          # Thêm thông tin chi tiết về request và assignments
          if result[:success]
            # Tìm tất cả assignments hoàn thành giữa hai hộ
            completed_assignments = ::Labor::LaborAssignment
              .joins(:labor_request)
              .includes(:worker, labor_request: [ :requesting_household ])
              .where(status: :completed)
              .where("labor_requests.request_type IN (?)", [ "exchange", "mixed" ])
              .where(
                '(labor_requests.requesting_household_id = ? AND home_household_id = ?) OR
                 (labor_requests.requesting_household_id = ? AND home_household_id = ?)',
                current_household.id, household_b_id,
                household_b_id, current_household.id
              )
              .order(work_date: :desc)

            # Tổ chức dữ liệu theo request
            assignments_by_request = completed_assignments.group_by(&:labor_request_id)

            detailed_requests = assignments_by_request.map do |request_id, assignments|
              request = assignments.first.labor_request

              {
                request_id: request_id,
                title: request.title,
                requesting_household: request.requesting_household.name,
                providing_household: assignments.first.home_household.name,
                work_dates: assignments.map(&:work_date).uniq.sort,
                completed_assignments: assignments.map do |a|
                  {
                    id: a.id,
                    worker_name: a.worker&.fullname || "Unknown Worker",
                    work_date: a.work_date,
                    hours_worked: a.hours_worked || 0, # Thêm fallback 0
                    work_units: a.respond_to?(:work_units) ? a.work_units : nil,
                    start_time: a.start_time, # Thêm để có thể hiển thị
                    end_time: a.end_time     # Thêm để có thể hiển thị
                  }
                end
              }
            end

            # Thêm thông tin chi tiết vào response
            result[:detailed_history] = detailed_requests

            render_success_response(result)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        private

        def set_labor_exchange
          @labor_exchange = ::Labor::LaborExchange.find(params[:id])
        end
      end
    end
  end
end
