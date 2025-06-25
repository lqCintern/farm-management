# app/controllers/api/v1/labor/labor_exchanges_controller.rb
module Controllers::Api
  module V1
    module Labor
      class LaborExchangesController < BaseController
        before_action :require_household
        before_action :set_labor_exchange, only: [ :show, :reset_balance ]

        def index
          summaries = Services::CleanArch.labor_list_household_exchanges.execute(current_household.id)
          render_success_response(summaries)
        end

        def show
          result = Services::CleanArch.labor_get_exchange_details.execute(
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
          result = Services::CleanArch.labor_reset_balance.execute(
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

          result = Services::CleanArch.labor_get_transaction_history.execute(
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

          result = Services::CleanArch.labor_adjust_balance.execute(
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

          # Add debugging
          Rails.logger.info "Starting recalculate for household_a_id: #{current_household.id}, household_b_id: #{household_b_id}"

          result = Services::CleanArch.labor_recalculate_balance.execute(
            current_household.id,
            household_b_id
          )

          # Add debugging to see what result contains
          Rails.logger.info "Recalculate result: #{result.inspect}"
          Rails.logger.info "Result class: #{result.class}"
          Rails.logger.info "Result keys: #{result.keys if result.is_a?(Hash)}"

          if result && result.is_a?(Hash) && result[:success]
            render_success_response({
              exchange: result[:exchange],
              old_balance: result[:old_balance],
              new_balance: result[:new_balance],
              difference: result[:diff]
            })
          else
            errors = result.is_a?(Hash) ? result[:errors] : ["Unknown error occurred"]
            render_error_response(errors, :unprocessable_entity)
          end
        end

        def recalculate_all
          # Get all exchanges with this household
          summaries = Services::CleanArch.labor_list_household_exchanges.execute(current_household.id)
          results = []

          Rails.logger.info "Recalculate all - summaries: #{summaries.inspect}"

          summaries.each do |summary|
            Rails.logger.info "Processing summary: #{summary.inspect}"
            Rails.logger.info "Summary class: #{summary.class}"
            
            # Skip if summary is not a hash
            next unless summary.is_a?(Hash)
            
            # Đảm bảo truy cập key an toàn với cả symbol và string
            partner_id = summary[:partner_household_id] || summary["partner_household_id"]
            partner_name = summary[:partner_household_name] || summary["partner_household_name"]

            Rails.logger.info "Partner ID: #{partner_id}, Partner Name: #{partner_name}"

            # Skip if partner_id is nil
            next unless partner_id

            result = Services::CleanArch.labor_recalculate_balance.execute(
              current_household.id,
              partner_id
            )

            Rails.logger.info "Recalculate result for partner #{partner_id}: #{result.inspect}"

            if result && result.is_a?(Hash) && result[:success]
              results << {
                household_id: partner_id,
                household_name: partner_name,
                old_balance: result[:old_balance],
                new_balance: result[:new_balance],
                difference: result[:diff]
              }
            end
          end

          render_success_response(results)
        end

        def initialize_exchanges
          result = Services::CleanArch.labor_initialize_exchanges.execute(current_household.id)

          if result[:success]
            render_success_response(result[:results])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        # Xem thông tin đổi công giữa hai hộ
        def show_by_household
          household_b_id = params[:household_id].to_i

          # Tìm exchange giữa hai hộ
          exchange_result = Services::CleanArch.labor_exchange_repository.find_by_households(
            current_household.id,
            household_b_id
          )

          if exchange_result[:success]
            exchange = exchange_result[:exchange]
            
            # Tính balance từ góc nhìn của current household
            balance = exchange.balance_for(current_household.id)
            
            # Lấy transactions
            transactions_result = Services::CleanArch.labor_get_transaction_history.execute(
              current_household.id,
              household_b_id,
              { include_details: true }
            )

            if transactions_result[:success]
              # Safely access data with fallbacks
              transactions_data = transactions_result[:data] || {}
              transactions = transactions_data[:transactions] || []
              total = transactions_data[:total] || 0
              pagination = transactions_data[:pagination] || {}
              
              result = Services::CleanArch.labor_get_exchange_details.execute(
                exchange.id,
                current_household.id
              )
              if result[:success]
                render_success_response(result[:data])
              else
                render_error_response(result[:errors], :unprocessable_entity)
              end
            else
              render_error_response(transactions_result[:errors], :unprocessable_entity)
            end
          else
            render_error_response(exchange_result[:errors], :not_found)
          end
        end

        private

        def set_labor_exchange
          result = Services::CleanArch.labor_exchange_repository.find(params[:id])

          if result[:success]
            @labor_exchange = result[:exchange]

            # Check access rights
            unless [ @labor_exchange.household_a_id, @labor_exchange.household_b_id ].include?(current_household.id)
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
