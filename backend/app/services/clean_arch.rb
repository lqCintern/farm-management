module CleanArch
  class << self
    # Lấy repository
    def marketplace_product_listing_repository
      @marketplace_product_listing_repository ||=
        Repositories::Marketplace::ProductListingRepository.new
    end

    def marketplace_harvest_repository
      @marketplace_harvest_repository ||=
        Repositories::Marketplace::MarketplaceHarvestRepository.new
    end

    # Repository methods
    def marketplace_product_order_repository
      @marketplace_product_order_repository ||= Repositories::Marketplace::ProductOrderRepository.new
    end

    # Các use case
    def marketplace_list_products
      @marketplace_list_products ||=
        Marketplace::ProductListings::ListProducts.new(
          marketplace_product_listing_repository
        )
    end

    def marketplace_get_product_details
      @marketplace_get_product_details ||=
        Marketplace::ProductListings::GetProductDetails.new(
          marketplace_product_listing_repository
        )
    end

    def marketplace_create_product_listing
      @marketplace_create_product_listing ||=
        Marketplace::ProductListings::CreateProductListing.new(
          marketplace_product_listing_repository
        )
    end

    def marketplace_update_product_listing
      @marketplace_update_product_listing ||=
        Marketplace::ProductListings::UpdateProductListing.new(
          marketplace_product_listing_repository
        )
    end

    def marketplace_change_product_status
      @marketplace_change_product_status ||=
        Marketplace::ProductListings::ChangeProductStatus.new(
          marketplace_product_listing_repository
        )
    end

    # Thêm use cases cho MarketplaceHarvests
    def marketplace_list_harvests
      @marketplace_list_harvests ||=
        Marketplace::MarketplaceHarvests::ListHarvests.new(
          marketplace_harvest_repository
        )
    end

    def marketplace_get_harvest_details
      @marketplace_get_harvest_details ||=
        Marketplace::MarketplaceHarvests::GetHarvestDetails.new(
          marketplace_harvest_repository
        )
    end

    def marketplace_create_harvest
      @marketplace_create_harvest ||=
        Marketplace::MarketplaceHarvests::CreateHarvest.new(
          marketplace_harvest_repository,
          marketplace_product_listing_repository
        )
    end

    def marketplace_update_harvest
      @marketplace_update_harvest ||=
        Marketplace::MarketplaceHarvests::UpdateHarvest.new(
          marketplace_harvest_repository
        )
    end

    def marketplace_process_payment
      @marketplace_process_payment ||=
        Marketplace::MarketplaceHarvests::ProcessPayment.new(
          marketplace_harvest_repository
        )
    end

    def marketplace_delete_harvest
      @marketplace_delete_harvest ||=
        Marketplace::MarketplaceHarvests::DeleteHarvest.new(
          marketplace_harvest_repository
        )
    end

    def marketplace_get_active_by_product
      @marketplace_get_active_by_product ||=
        Marketplace::MarketplaceHarvests::GetActiveByProduct.new(
          marketplace_harvest_repository
        )
    end

    def marketplace_list_my_listings
      @marketplace_list_my_listings ||=
        Marketplace::ProductListings::ListMyListings.new(
          marketplace_product_listing_repository
        )
    end

    # Use case methods
    def marketplace_list_orders
      @marketplace_list_orders ||= Marketplace::ProductOrders::ListOrders.new(
        marketplace_product_order_repository
      )
    end

    def marketplace_get_order_details
      @marketplace_get_order_details ||= Marketplace::ProductOrders::GetOrderDetails.new(
        marketplace_product_order_repository
      )
    end

    def marketplace_create_order
      @marketplace_create_order ||= Marketplace::ProductOrders::CreateOrder.new(
        marketplace_product_order_repository,
        marketplace_product_listing_repository
      )
    end

    def marketplace_update_order_status
      @marketplace_update_order_status ||= Marketplace::ProductOrders::UpdateOrderStatus.new(
        marketplace_product_order_repository,
        marketplace_product_listing_repository,
        nil,
        notification_service,
        nil
      )
    end

    def marketplace_update_order_details
      @marketplace_update_order_details ||= Marketplace::ProductOrders::UpdateOrderDetails.new(
        marketplace_product_order_repository
      )
    end

    # Notification repository
    def notification_repository
      @notification_repository ||= Repositories::Notification::NotificationRepository.new
    end

    # Notification use cases
    def notification_list
      @notification_list ||= Notification::ListNotifications.new(notification_repository)
    end

    def notification_get_details
      @notification_get_details ||= Notification::GetNotificationDetails.new(notification_repository)
    end

    def notification_mark_as_read
      @notification_mark_as_read ||= Notification::MarkAsRead.new(notification_repository)
    end

    def notification_mark_as_unread
      @notification_mark_as_unread ||= Notification::MarkAsUnread.new(notification_repository)
    end

    def notification_mark_all_as_read
      @notification_mark_all_as_read ||= Notification::MarkAllAsRead.new(notification_repository)
    end

    def notification_get_unread_count
      @notification_get_unread_count ||= Notification::GetUnreadCount.new(notification_repository)
    end

    def notification_create
      @notification_create ||= Notification::CreateNotification.new(notification_repository)
    end

    def notification_delete
      @notification_delete ||= Notification::DeleteNotification.new(notification_repository)
    end

    # Notification Service - phục vụ cho toàn bộ ứng dụng
    def notification_service
      @notification_service ||= NotificationServices::CleanNotificationService.new(notification_create)
    end

    # Pineapple Crop repositories
    def farming_pineapple_crop_repository
      @farming_pineapple_crop_repository ||= Repositories::Farming::PineappleCropRepository.new
    end

    # Pineapple Crop use cases
    def farming_get_pineapple_crop
      @farming_get_pineapple_crop ||= Farming::PineappleCrops::GetPineappleCrop.new(
        farming_pineapple_crop_repository
      )
    end

    def farming_list_pineapple_crops
      @farming_list_pineapple_crops ||= Farming::PineappleCrops::ListPineappleCrops.new(
        farming_pineapple_crop_repository,
        pagination_service
      )
    end

    def farming_create_pineapple_crop
      @farming_create_pineapple_crop ||= Farming::PineappleCrops::CreatePineappleCrop.new(
        farming_pineapple_crop_repository,
        farming_plan_generator_service
      )
    end

    def farming_update_pineapple_crop
      @farming_update_pineapple_crop ||= Farming::PineappleCrops::UpdatePineappleCrop.new(
        farming_pineapple_crop_repository
      )
    end

    def farming_delete_pineapple_crop
      @farming_delete_pineapple_crop ||= Farming::PineappleCrops::DeletePineappleCrop.new(
        farming_pineapple_crop_repository
      )
    end

    def farming_generate_pineapple_plan
      @farming_generate_pineapple_plan ||= Farming::PineappleCrops::GeneratePineapplePlan.new(
        farming_pineapple_crop_repository
      )
    end

    def farming_advance_stage
      @farming_advance_stage ||= Farming::PineappleCrops::AdvanceStage.new(
        farming_pineapple_crop_repository
      )
    end

    def farming_record_harvest
      @farming_record_harvest ||= Farming::PineappleCrops::RecordHarvest.new(
        farming_pineapple_crop_repository
      )
    end

    def farming_preview_plan
      @farming_preview_plan ||= Farming::PineappleCrops::PreviewPlan.new(
        farming_pineapple_crop_repository
      )
    end

    def farming_confirm_plan
      @farming_confirm_plan ||= Farming::PineappleCrops::ConfirmPlan.new(
        farming_pineapple_crop_repository
      )
    end

    def farming_clean_activities
      @farming_clean_activities ||= Farming::PineappleCrops::CleanActivities.new(
        farming_pineapple_crop_repository
      )
    end

    def farming_get_statistics
      @farming_get_statistics ||= Farming::PineappleCrops::GetStatistics.new(
        farming_pineapple_crop_repository
      )
    end

    def farming_plan_generator_service
      @farming_plan_generator_service ||= Farming::PlanGeneratorService.new
    end

    # Thêm service phân trang nếu chưa có
    def pagination_service
      @pagination_service ||= PaginationService.new
    end

    # Repositories
    def farming_farm_activity_repository
      @farming_farm_activity_repository ||= Repositories::Farming::FarmActivityRepository.new
    end

    # Services
    def farming_farm_activity_notification_service
      @farming_farm_activity_notification_service ||= Services::Farming::FarmActivityNotificationService.new
    end

    def farming_farm_activity_stats_service
      @farming_farm_activity_stats_service ||= Services::Farming::FarmActivityStatsService.new
    end

    # Use Cases
    def farming_list_farm_activities
      @farming_list_farm_activities ||= Farming::FarmActivities::ListFarmActivities.new(
        farming_farm_activity_repository
      )
    end

    def farming_get_farm_activity
      @farming_get_farm_activity ||= Farming::FarmActivities::GetFarmActivity.new(
        farming_farm_activity_repository
      )
    end

    def farming_create_farm_activity
      @farming_create_farm_activity ||= Farming::FarmActivities::CreateFarmActivity.new(
        farming_farm_activity_repository,
        farming_farm_activity_notification_service
      )
    end

    def farming_update_farm_activity
      @farming_update_farm_activity ||= Farming::FarmActivities::UpdateFarmActivity.new(
        farming_farm_activity_repository,
        farming_farm_activity_notification_service
      )
    end

    def farming_delete_farm_activity
      @farming_delete_farm_activity ||= Farming::FarmActivities::DeleteFarmActivity.new(
        farming_farm_activity_repository
      )
    end

    def farming_complete_farm_activity
      @farming_complete_farm_activity ||= Farming::FarmActivities::CompleteFarmActivity.new(
        farming_farm_activity_repository,
        farming_farm_activity_notification_service
      )
    end

    def farming_get_stage_activities
      @farming_get_stage_activities ||= Farming::FarmActivities::GetStageActivities.new(
        farming_farm_activity_repository
      )
    end

    def farming_check_upcoming_activities
      @farming_check_upcoming_activities ||= Farming::FarmActivities::CheckUpcomingActivities.new(
        farming_farm_activity_repository,
        farming_farm_activity_notification_service
      )
    end

    def farming_get_farm_activity_stats
      @farming_get_farm_activity_stats ||= Farming::FarmActivities::GetFarmActivityStats.new(
        farming_farm_activity_repository,
        farming_farm_activity_stats_service
      )
    end

    # Rest of CleanArch methods...
  end
end
