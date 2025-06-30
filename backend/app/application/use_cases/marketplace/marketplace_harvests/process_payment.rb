module UseCases::Marketplace
  module MarketplaceHarvests
    class ProcessPayment
      def initialize(repository, conversation_service = nil)
        @repository = repository
        @conversation_service = conversation_service || Services::Marketplace::ConversationService.new
      end

      def execute(id, payment_proof, user_id, additional_params = {})
        # Find existing harvest
        existing = @repository.find(id)

        unless existing
          return { success: false, error: "Không tìm thấy lịch thu hoạch" }
        end

        # Verify ownership
        unless existing.trader_id == user_id
          return { success: false, error: "Bạn không có quyền cập nhật bằng chứng thanh toán" }
        end

        # Save payment proof using ActiveStorage
        result = @repository.attach_payment_proof(id, payment_proof)

        if result
          # Send payment proof message to conversation
          send_payment_proof_message(result, user_id, additional_params)
          
          { success: true, harvest: result, message: "Đã cập nhật bằng chứng thanh toán thành công" }
        else
          { success: false, error: "Không thể cập nhật bằng chứng thanh toán" }
        end
      end

      private

      def send_payment_proof_message(harvest, user_id, additional_params)
        # Find conversation between trader and farmer
        conversation = @conversation_service.find_conversation(harvest.product_listing_id, harvest.trader_id)
        
        return unless conversation

        # Prepare message content
        message_content = "Đã hoàn thành thanh toán"
        if additional_params[:final_price].present?
          message_content += " #{additional_params[:final_price].to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse} đồng"
        end
        message_content += " cho sản phẩm #{harvest.product_listing.title}"

        # Prepare payment info
        payment_info = {
          amount: additional_params[:final_price],
          date: additional_params[:payment_date] || Time.current.strftime('%d/%m/%Y %H:%M'),
          harvest_id: harvest.id,
          product_title: harvest.product_listing.title
        }

        # Send message with payment proof image
        @conversation_service.send_message(
          conversation.id,
          user_id,
          message_content,
          "payment",
          {
            image_url: harvest.payment_proof_url,
            payment_info: payment_info
          }
        )
      end
    end
  end
end
