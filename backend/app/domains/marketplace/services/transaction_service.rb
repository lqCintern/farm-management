module Marketplace
  module Services
    class TransactionService
    # Tạo transaction khi hoàn thành thanh toán
    def create_sale_transaction(source, amount: nil, description: nil)
      return unless defined?(::Marketplace::Transaction)

      case source
      when ::Marketplace::MarketplaceHarvest
        create_harvest_transaction(source)
      when ::Marketplace::ProductOrder
        create_order_transaction(source)
      else
        Rails.logger.error("Unsupported source type for transaction: #{source.class.name}")
      end
    end

    # Tạo bản ghi Sale để lưu thông tin bán hàng
    def create_sale_record(source)
      return unless defined?(::Marketplace::Sale)

      case source
      when ::Marketplace::MarketplaceHarvest
        ::Marketplace::Sale.create(
          user_id: source.product_listing.user_id,
          crop_id: source.product_listing.crop_animal_id,
          harvest_id: source.id,
          quantity: source.actual_quantity || source.estimated_quantity,
          amount: source.final_price || (source.estimated_price * source.estimated_quantity),
          sale_date: source.payment_date || Time.current
        )
      when ::Marketplace::ProductOrder
        ::Marketplace::Sale.create(
          user_id: source.product_listing.user_id,
          crop_id: source.product_listing.crop_animal_id,
          product_order_id: source.id,
          quantity: source.quantity,
          amount: source.price * source.quantity,
          sale_date: Time.current
        )
      else
        Rails.logger.error("Unsupported source type for sale record: #{source.class.name}")
      end
    end

    private

    def create_harvest_transaction(harvest)
      # Tính tổng số tiền
      total_amount = harvest.final_price || (harvest.actual_quantity * harvest.estimated_price)
      seller_id = harvest.product_listing.user_id
      buyer_name = User.find_by(user_id: harvest.trader_id)&.fullname || "Thương lái"
      product_name = harvest.product_listing.title
      quantity = harvest.actual_quantity || harvest.estimated_quantity
      product_type = harvest.product_listing.product_type

      # Ghi nhận doanh thu cho người bán (farmer)
      ::Marketplace::Transaction.create(
        user_id: seller_id,
        transaction_type: 1, # income
        amount: total_amount,
        description: "Bán #{quantity} #{product_type} (#{product_name}) cho #{buyer_name}",
        date: harvest.payment_date || Time.current
      )

      # Đồng thời tạo bản ghi Sale
      create_sale_record(harvest)
    end

    def create_order_transaction(order)
      total_amount = order.price * order.quantity
      seller_id = order.product_listing.user_id
      buyer_name = order.buyer&.fullname || "Thương lái"
      product_type = order.product_listing.product_type

      # Ghi nhận doanh thu cho người bán
      ::Marketplace::Transaction.create(
        user_id: seller_id,
        transaction_type: 1, # income
        amount: total_amount,
        description: "Bán #{order.quantity} #{product_type} cho #{buyer_name}",
        date: Time.current
      )

      # Đồng thời tạo bản ghi Sale
      create_sale_record(order)
    end
      end
  end
end