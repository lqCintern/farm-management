# filepath: /Users/chien.le/projects/farm-management/backend/app/services/pagination_service.rb
module Services
  class PaginationService
    def paginate(collection, page: 1, items: 10)
      # Convert parameters to integers
      page = page.to_i
      items_per_page = items.to_i

      # Tạo đối tượng Pagy
      pagy = Pagy.new(count: collection.count, page: page, items: items_per_page)

      # Tính offset sử dụng biến items_per_page
      offset = (pagy.page - 1) * items_per_page

      # Truy vấn records với offset và limit
      records = collection.offset(offset).limit(items_per_page)

      [ pagy, records ]
    end
  end
end
