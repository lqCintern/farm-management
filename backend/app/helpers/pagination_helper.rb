module PaginationHelper
  def pagy_metadata(pagy)
    {
      current_page: pagy.page,
      next_page: pagy.next,
      prev_page: pagy.prev,
      total_pages: pagy.pages,
      total_items: pagy.count
    }
  end
end
