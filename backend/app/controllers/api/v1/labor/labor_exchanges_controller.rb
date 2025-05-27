# app/controllers/api/v1/labor/labor_exchanges_controller.rb
module Api
  module V1
    module Labor
      class LaborExchangesController < BaseController
        before_action :require_household
        before_action :set_labor_exchange, only: [:show, :reset_balance]
        
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
        
        def summary
          @summaries = ::Labor::ExchangeService.get_household_exchanges(current_household.id)
          render_success_response(@summaries)
        end
        
        private
        
        def set_labor_exchange
          @labor_exchange = ::Labor::LaborExchange.find(params[:id])
        end
      end
    end
  end
end
