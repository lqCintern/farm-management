module Dtos
  module SupplyChain
    class SupplierReviewStatsDto
      attr_reader :average_rating, :rating_distribution, :total_reviews

      def initialize(stats)
        @average_rating = stats[:average_rating]
        @rating_distribution = stats[:rating_distribution]
        @total_reviews = stats[:total_reviews]
      end
      
      def as_json(*)
        {
          average_rating: @average_rating,
          rating_distribution: @rating_distribution,
          total_reviews: @total_reviews
        }
      end
    end
  end
end