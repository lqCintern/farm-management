module Repositories
  module SupplyChain
    class SupplierReviewRepository
      include Interfaces::Repositories::SupplyChain::SupplierReviewRepositoryInterface
      
      def find_by_supplier(supplier_id, page = 1, per_page = 10)
        query = ::SupplyChain::SupplierReview
          .where(supplier_id: supplier_id)
          .includes(:reviewer, :supplier, :supply_listing)
          .order(created_at: :desc)
        
        # Apply pagination
        paginated = query.page(page).per(per_page)
        
        reviews = paginated.map { |record| map_to_entity(record) }
        
        {
          success: true,
          reviews: reviews,
          pagination: {
            total_pages: paginated.total_pages,
            current_page: paginated.current_page,
            total_count: paginated.total_count
          }
        }
      end
      
      def find_by_order(order_id)
        record = ::SupplyChain::SupplierReview.find_by(supply_order_id: order_id)
        
        if record
          { success: true, review: map_to_entity(record) }
        else
          { success: false, errors: ["Không tìm thấy đánh giá"] }
        end
      end
      
      def create(entity)
        # Check if review already exists for this order
        if ::SupplyChain::SupplierReview.exists?(supply_order_id: entity.supply_order_id)
          return { success: false, errors: ["Đơn hàng này đã được đánh giá"] }
        end
        
        # Check if order is completed
        order = ::SupplyChain::SupplyOrder.find_by(id: entity.supply_order_id)
        
        unless order && order.completed?
          return { success: false, errors: ["Chỉ có thể đánh giá đơn hàng đã hoàn thành"] }
        end
        
        # Check if reviewer is the one who placed the order
        unless order.user_id == entity.reviewer_id
          return { success: false, errors: ["Bạn không có quyền đánh giá đơn hàng này"] }
        end
        
        # Get supplier and supply listing
        supplier_id = order.supply_listing.user.user_id
        supply_listing_id = order.supply_listing_id
        
        # Create the review
        record = ::SupplyChain::SupplierReview.new(
          supply_order_id: entity.supply_order_id,
          supply_listing_id: supply_listing_id,
          reviewer_id: entity.reviewer_id,
          supplier_id: supplier_id,
          rating: entity.rating,
          content: entity.content
        )
        
        if record.save
          # Update supplier average rating
          update_supplier_average_rating(supplier_id)
          
          { success: true, review: map_to_entity(record) }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end
      
      def get_supplier_rating_stats(supplier_id)
        # Get rating distribution
        rating_stats = ::SupplyChain::SupplierReview
          .where(supplier_id: supplier_id)
          .group(:rating)
          .count
        
        # Get average rating
        avg_rating = ::SupplyChain::SupplierReview
          .where(supplier_id: supplier_id)
          .average(:rating)
          .to_f.round(1)
        
        # Get total count
        total_reviews = ::SupplyChain::SupplierReview
          .where(supplier_id: supplier_id)
          .count
        
        {
          success: true,
          stats: {
            rating_distribution: rating_stats,
            average_rating: avg_rating,
            total_reviews: total_reviews
          }
        }
      end
      
      private
      
      def map_to_entity(record)
        entity = Entities::SupplyChain::SupplierReview.new(
          id: record.id,
          supply_order_id: record.supply_order_id,
          supply_listing_id: record.supply_listing_id,
          reviewer_id: record.reviewer_id,
          supplier_id: record.supplier_id,
          rating: record.rating,
          content: record.content,
          created_at: record.created_at,
          updated_at: record.updated_at
        )
        
        # Add reviewer info
        if record.reviewer
          entity.reviewer = {
            id: record.reviewer.user_id,
            name: record.reviewer.user_name
          }
        end
        
        # Add supplier info
        if record.supplier
          entity.supplier = {
            id: record.supplier.user_id,
            name: record.supplier.user_name
          }
        end
        
        # Add supply listing info
        if record.supply_listing
          entity.supply_listing = {
            id: record.supply_listing.id,
            name: record.supply_listing.name
          }
        end
        
        entity
      end
      
      def update_supplier_average_rating(supplier_id)
        avg_rating = ::SupplyChain::SupplierReview
          .where(supplier_id: supplier_id)
          .average(:rating)
          .to_f.round(1)
        
        supplier = ::User.find_by(user_id: supplier_id)
        if supplier && supplier.respond_to?(:average_rating=)
          supplier.update(average_rating: avg_rating)
        end
      end
    end
  end
end