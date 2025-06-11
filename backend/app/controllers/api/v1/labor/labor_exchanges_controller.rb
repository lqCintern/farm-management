# app/controllers/api/v1/labor/labor_exchanges_controller.rb
module Api
  module V1
    module Labor
      class LaborExchangesController < BaseController
        before_action :require_household
        before_action :set_labor_exchange, only: [:show, :reset_balance]

        def index
          summaries = CleanArch.labor_list_household_exchanges.execute(current_household.id)
          render_success_response(summaries)
        end

        def show
          result = CleanArch.labor_get_exchange_details.execute(
            @labor_exchange.id,
            current_household.id
          )

          if result[:success]
            render_success_response(result)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def reset_balance
          result = CleanArch.labor_reset_balance.execute(
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

          result = CleanArch.labor_get_transaction_history.execute(
            current_household.id,
            household_b_id,
            { page: page, per_page: per_page }
          )

          if result[:success]
            render_success_response(result)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        # Điều chỉnh số dư công thủ công
        def adjust_balance
          household_b_id = params[:household_id].to_i
          hours = params[:hours].to_f
          notes = params[:notes]

          result = CleanArch.labor_adjust_balance.execute(
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

          result = CleanArch.labor_recalculate_balance.execute(
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
          # Get all exchanges with this household
          summaries = CleanArch.labor_list_household_exchanges.execute(current_household.id)
          results = []

          summaries.each do |summary|
            result = CleanArch.labor_recalculate_balance.execute(
              current_household.id,
              summary[:partner_household_id]
            )

            if result[:success]
              results << {
                household_id: summary[:partner_household_id],
                household_name: summary[:partner_household_name],
                old_balance: result[:old_balance],
                new_balance: result[:new_balance],
                difference: result[:diff]
              }
            end
          end

          render_success_response(results)
        end

        def initialize_exchanges
          result = CleanArch.labor_initialize_exchanges.execute(current_household.id)
          
          if result[:success]
            render_success_response(result[:results])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        # Xem thông tin đổi công giữa hai hộ
        def show_by_household
          household_b_id = params[:household_id].to_i

          # Sử dụng use case get_exchange_details + find_by_households
          result = CleanArch.labor_get_transaction_history.execute(
            current_household.id,
            household_b_id,
            { include_details: true }
          )

          if result[:success]
            render_success_response(result)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        private

        def set_labor_exchange
          result = CleanArch.labor_exchange_repository.find(params[:id])
          
          if result[:success]
            @labor_exchange = result[:exchange]
            
            # Check access rights
            unless [@labor_exchange.household_a_id, @labor_exchange.household_b_id].include?(current_household.id)
              render_error_response("Bạn không có quyền truy cập thông tin này", :forbidden)
            end
          else
            render_error_response("Không tìm thấy giao dịch đổi công", :not_found)
          end
        end
      end
    end
  end
end
