module Dtos
  module SupplyChain
    class PaginationDto
      attr_reader :total_pages, :current_page, :total_count, :per_page

      def initialize(total_pages, current_page, total_count, per_page)
        @total_pages = total_pages
        @current_page = current_page
        @total_count = total_count
        @per_page = per_page
      end

      def as_json(*)
        {
          total_pages: @total_pages,
          current_page: @current_page,
          total_count: @total_count,
          per_page: @per_page
        }
      end
    end
  end
end
