module Farming
  module Presenters
    class BasePresenter
      def self.present(object)
        new(object).as_json
      end

      def self.present_collection(collection, pagination = nil)
        {
          items: collection.map { |item| present(item) },
          pagination: pagination ? format_pagination(pagination) : nil
        }.compact
      end

      def self.format_pagination(pagy)
        {
          current_page: pagy.page,
          total_pages: pagy.pages,
          total_items: pagy.count
        }
      end

      def initialize(object)
        @object = object
      end

      def as_json
        raise NotImplementedError, "Subclasses must implement as_json"
      end
    end
  end
end