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
    
    def prepare_labor_notification
      @prepare_labor_notification ||= Notification::PrepareLaborRequestNotification.new(
        labor_farm_household_repository
      )
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

    def farming_get_farm_activity_history_by_field
      @farming_get_farm_activity_history_by_field ||= Farming::FarmActivities::GetFarmActivityHistoryByField.new(
        farming_farm_activity_repository
      )
    end

    # Farm Material Repositories
    def farming_farm_material_repository
      @farming_farm_material_repository ||= Repositories::Farming::FarmMaterialRepository.new
    end

    # Farm Material Use Cases
    def farming_list_farm_materials
      @farming_list_farm_materials ||= Farming::FarmMaterials::ListFarmMaterials.new(
        farming_farm_material_repository
      )
    end

    def farming_get_farm_material
      @farming_get_farm_material ||= Farming::FarmMaterials::GetFarmMaterial.new(
        farming_farm_material_repository
      )
    end

    def farming_create_farm_material
      @farming_create_farm_material ||= Farming::FarmMaterials::CreateFarmMaterial.new(
        farming_farm_material_repository
      )
    end

    def farming_update_farm_material
      @farming_update_farm_material ||= Farming::FarmMaterials::UpdateFarmMaterial.new(
        farming_farm_material_repository
      )
    end

    def farming_delete_farm_material
      @farming_delete_farm_material ||= Farming::FarmMaterials::DeleteFarmMaterial.new(
        farming_farm_material_repository
      )
    end

    # Repositories
    def farming_pineapple_activity_template_repository
      @farming_pineapple_activity_template_repository ||= Repositories::Farming::PineappleActivityTemplateRepository.new
    end

    # Use Cases
    def farming_list_pineapple_activity_templates
      @farming_list_pineapple_activity_templates ||= Farming::PineappleActivityTemplates::ListPineappleActivityTemplates.new(
        farming_pineapple_activity_template_repository
      )
    end

    def farming_get_pineapple_activity_template
      @farming_get_pineapple_activity_template ||= Farming::PineappleActivityTemplates::GetPineappleActivityTemplate.new(
        farming_pineapple_activity_template_repository
      )
    end

    def farming_create_pineapple_activity_template
      @farming_create_pineapple_activity_template ||= Farming::PineappleActivityTemplates::CreatePineappleActivityTemplate.new(
        farming_pineapple_activity_template_repository
      )
    end

    def farming_update_pineapple_activity_template
      @farming_update_pineapple_activity_template ||= Farming::PineappleActivityTemplates::UpdatePineappleActivityTemplate.new(
        farming_pineapple_activity_template_repository
      )
    end

    def farming_delete_pineapple_activity_template
      @farming_delete_pineapple_activity_template ||= Farming::PineappleActivityTemplates::DeletePineappleActivityTemplate.new(
        farming_pineapple_activity_template_repository
      )
    end

    def farming_apply_template_to_activities
      @farming_apply_template_to_activities ||= Farming::PineappleActivityTemplates::ApplyTemplateToActivities.new(
        farming_pineapple_activity_template_repository
      )
    end

    # Repositories
    def farming_field_repository
      @farming_field_repository ||= Repositories::Farming::FieldRepository.new
    end

    # Use Cases
    def farming_list_fields
      @farming_list_fields ||= Farming::Fields::ListFields.new(
        farming_field_repository
      )
    end

    def farming_get_field
      @farming_get_field ||= Farming::Fields::GetField.new(
        farming_field_repository
      )
    end

    def farming_create_field
      @farming_create_field ||= Farming::Fields::CreateField.new(
        farming_field_repository
      )
    end

    def farming_update_field
      @farming_update_field ||= Farming::Fields::UpdateField.new(
        farming_field_repository
      )
    end

    def farming_delete_field
      @farming_delete_field ||= Farming::Fields::DeleteField.new(
        farming_field_repository
      )
    end

    def farming_get_field_activities
      @farming_get_field_activities ||= Farming::Fields::GetFieldActivities.new(
        farming_field_repository
      )
    end

    def farming_get_field_harvests
      @farming_get_field_harvests ||= Farming::Fields::GetFieldHarvests.new(
        farming_field_repository
      )
    end

    def farming_get_field_pineapple_crops
      @farming_get_field_pineapple_crops ||= Farming::Fields::GetFieldPineappleCrops.new(
        farming_field_repository
      )
    end

    def farming_get_field_stats
      @farming_get_field_stats ||= Farming::Fields::GetFieldStats.new(
        farming_field_repository
      )
    end

    # Repositories
    def farming_harvest_repository
      @farming_harvest_repository ||= Repositories::Farming::HarvestRepository.new
    end

    # Use Cases
    def farming_list_harvests
      @farming_list_harvests ||= Farming::Harvests::ListHarvests.new(
        farming_harvest_repository
      )
    end

    def farming_get_harvest
      @farming_get_harvest ||= Farming::Harvests::GetHarvest.new(
        farming_harvest_repository
      )
    end

    def farming_get_harvests_by_crop
      @farming_get_harvests_by_crop ||= Farming::Harvests::GetHarvestsByCrop.new(
        farming_harvest_repository
      )
    end

    def farming_get_harvests_by_field
      @farming_get_harvests_by_field ||= Farming::Harvests::GetHarvestsByField.new(
        farming_harvest_repository
      )
    end

    def farming_create_harvest
      @farming_create_harvest ||= Farming::Harvests::CreateHarvest.new(
        farming_harvest_repository
      )
    end

    def farming_update_harvest
      @farming_update_harvest ||= Farming::Harvests::UpdateHarvest.new(
        farming_harvest_repository
      )
    end

    def farming_delete_harvest
      @farming_delete_harvest ||= Farming::Harvests::DeleteHarvest.new(
        farming_harvest_repository
      )
    end

    def farming_get_harvest_stats
      @farming_get_harvest_stats ||= Farming::Harvests::GetHarvestStats.new(
        farming_harvest_repository
      )
    end

    # Labor Farm Household repositories
    def labor_farm_household_repository
      @labor_farm_household_repository ||= Repositories::Labor::FarmHouseholdRepository.new
    end

    # Labor Farm Household use cases
    def labor_list_farm_households
      @labor_list_farm_households ||= Labor::FarmHouseholds::ListFarmHouseholds.new(
        labor_farm_household_repository
      )
    end

    def labor_get_household_summary
      @labor_get_household_summary ||= Labor::FarmHouseholds::GetHouseholdSummary.new(
        labor_farm_household_repository
      )
    end

    def labor_create_farm_household
      @labor_create_farm_household ||= Labor::FarmHouseholds::CreateFarmHousehold.new(
        labor_farm_household_repository
      )
    end

    def labor_update_farm_household
      @labor_update_farm_household ||= Labor::FarmHouseholds::UpdateFarmHousehold.new(
        labor_farm_household_repository
      )
    end

    def labor_delete_farm_household
      @labor_delete_farm_household ||= Labor::FarmHouseholds::DeleteFarmHousehold.new(
        labor_farm_household_repository
      )
    end

    def labor_add_worker_to_household
      @labor_add_worker_to_household ||= Labor::FarmHouseholds::AddWorkerToHousehold.new(
        labor_farm_household_repository
      )
    end

    # Labor Assignment repository
    def labor_assignment_repository
      @labor_assignment_repository ||= Repositories::Labor::LaborAssignmentRepository.new
    end

    # Labor Assignment use cases
    def labor_create_assignment
      @labor_create_assignment ||= Labor::LaborAssignments::CreateAssignment.new(
        labor_assignment_repository
      )
    end

    def labor_batch_assign_workers
      @labor_batch_assign_workers ||= Labor::LaborAssignments::BatchAssignWorkers.new(
        labor_assignment_repository
      )
    end

    def labor_update_assignment_status
      @labor_update_assignment_status ||= Labor::LaborAssignments::UpdateAssignmentStatus.new(
        labor_assignment_repository
      )
    end

    def labor_list_worker_assignments
      @labor_list_worker_assignments ||= Labor::LaborAssignments::ListWorkerAssignments.new(
        labor_assignment_repository
      )
    end

    def labor_list_household_assignments
      @labor_list_household_assignments ||= Labor::LaborAssignments::ListHouseholdAssignments.new(
        labor_assignment_repository
      )
    end

    def labor_complete_multiple_assignments
      @labor_complete_multiple_assignments ||= Labor::LaborAssignments::CompleteMultipleAssignments.new(
        labor_assignment_repository
      )
    end

    def labor_rate_assignment
      @labor_rate_assignment ||= Labor::LaborAssignments::RateAssignment.new(
        labor_assignment_repository
      )
    end

    def labor_check_scheduling
      @labor_check_scheduling ||= Labor::LaborAssignments::CheckScheduling.new(
        labor_assignment_repository
      )
    end

    def labor_list_request_assignments
      @labor_list_request_assignments ||= Labor::LaborAssignments::ListRequestAssignments.new(
        labor_assignment_repository
      )
    end

    def labor_delete_assignment
      @labor_delete_assignment ||= Labor::LaborAssignments::DeleteAssignment.new(
        labor_assignment_repository
      )
    end

    def labor_get_assignment
      @labor_get_assignment ||= Labor::LaborAssignments::GetAssignment.new(
        labor_assignment_repository
      )
    end

    # Household Worker repository
    def labor_household_worker_repository
      @labor_household_worker_repository ||= Repositories::Labor::HouseholdWorkerRepository.new
    end

    # Worker Profile repository
    def labor_worker_profile_repository
      @labor_worker_profile_repository ||= Repositories::Labor::WorkerProfileRepository.new
    end

    # Household Worker use cases
    def labor_list_household_workers
      @labor_list_household_workers ||= Labor::HouseholdWorkers::ListHouseholdWorkers.new(
        labor_household_worker_repository
      )
    end

    def labor_add_worker_to_household
      @labor_add_worker_to_household ||= Labor::HouseholdWorkers::AddWorkerToHousehold.new(
        labor_household_worker_repository
      )
    end

    def labor_remove_worker
      @labor_remove_worker ||= Labor::HouseholdWorkers::RemoveWorker.new(
        labor_household_worker_repository,
        labor_farm_household_repository
      )
    end

    def labor_update_worker_status
      @labor_update_worker_status ||= Labor::HouseholdWorkers::UpdateWorkerStatus.new(
        labor_household_worker_repository,
        labor_farm_household_repository
      )
    end

    # Worker Profile use cases
    def labor_create_or_update_profile
      @labor_create_or_update_profile ||= Labor::WorkerProfiles::CreateOrUpdateProfile.new(
        labor_worker_profile_repository
      )
    end

    def labor_find_available_workers
      @labor_find_available_workers ||= Labor::WorkerProfiles::FindAvailableWorkers.new(
        labor_worker_profile_repository
      )
    end

    def labor_get_worker_statistics
      @labor_get_worker_statistics ||= Labor::WorkerProfiles::GetWorkerStatistics.new(
        labor_worker_profile_repository
      )
    end

    def labor_get_or_create_profile
      @labor_get_or_create_profile ||= Labor::WorkerProfiles::GetOrCreateProfile.new(
        labor_worker_profile_repository
      )
    end

    def labor_check_worker_availability
      @labor_check_worker_availability ||= Labor::WorkerProfiles::CheckWorkerAvailability.new(
        labor_worker_profile_repository
      )
    end

    # Labor Request repositories
    def labor_request_repository
      @labor_request_repository ||= Repositories::Labor::LaborRequestRepository.new
    end

    def labor_exchange_repository
      @labor_exchange_repository ||= Repositories::Labor::LaborExchangeRepository.new
    end

    # Labor Request use cases
    def labor_list_requests
      @labor_list_requests ||= Labor::LaborRequests::ListRequests.new(
        labor_request_repository
      )
    end

    def labor_get_request
      @labor_get_request ||= Labor::LaborRequests::GetRequest.new(
        labor_request_repository
      )
    end

    def labor_create_request
      @labor_create_request ||= Labor::LaborRequests::CreateRequest.new(
        labor_request_repository,
        labor_farm_household_repository
      )
    end

    def labor_update_request
      @labor_update_request ||= Labor::LaborRequests::UpdateRequest.new(
        labor_request_repository,
        labor_farm_household_repository
      )
    end

    def labor_delete_request
      @labor_delete_request ||= Labor::LaborRequests::DeleteRequest.new(
        labor_request_repository,
        labor_farm_household_repository,
        labor_assignment_repository
      )
    end

    def labor_process_request
      @labor_process_request ||= Labor::LaborRequests::ProcessLaborRequest.new(
        labor_request_repository,
        labor_farm_household_repository,
        labor_assignment_repository,
        notification_service
      )
    end

    def labor_list_public_requests
      @labor_list_public_requests ||= Labor::LaborRequests::ListPublicRequests.new(
        labor_request_repository
      )
    end

    def labor_join_request
      @labor_join_request ||= Labor::LaborRequests::JoinRequest.new(
        labor_request_repository,
        labor_farm_household_repository
      )
    end

        def labor_create_mixed_request
      @labor_create_mixed_request ||= Labor::LaborRequests::CreateMixedRequest.new(
        labor_request_repository,
        labor_farm_household_repository
      )
    end

    def labor_get_group_status
      @labor_get_group_status ||= Labor::LaborRequests::GetGroupStatus.new(
        labor_request_repository
      )
    end

    def labor_suggest_workers
      @labor_suggest_workers ||= Labor::LaborRequests::SuggestWorkers.new(
        labor_request_repository,
        labor_worker_profile_repository
      )
    end

    def labor_list_requests_by_activity
      @labor_list_requests_by_activity ||= Labor::LaborRequests::ListRequestsByActivity.new(
        labor_request_repository
      )
    end

    # Labor Exchange use cases
    def labor_list_household_exchanges
      @labor_list_household_exchanges ||= Labor::LaborExchanges::ListHouseholdExchanges.new(
        labor_exchange_repository
      )
    end

    def labor_get_exchange_details
      @labor_get_exchange_details ||= Labor::LaborExchanges::GetExchangeDetails.new(
        labor_exchange_repository
      )
    end

    def labor_reset_balance
      @labor_reset_balance ||= Labor::LaborExchanges::ResetBalance.new(
        labor_exchange_repository,
        labor_farm_household_repository
      )
    end

    def labor_get_transaction_history
      @labor_get_transaction_history ||= Labor::LaborExchanges::GetTransactionHistory.new(
        labor_exchange_repository
      )
    end

    def labor_adjust_balance
      @labor_adjust_balance ||= Labor::LaborExchanges::AdjustBalance.new(
        labor_exchange_repository,
        labor_farm_household_repository
      )
    end

    def labor_recalculate_balance
      @labor_recalculate_balance ||= Labor::LaborExchanges::RecalculateBalance.new(
        labor_exchange_repository
      )
    end

    def labor_process_completed_assignment
      @labor_process_completed_assignment ||= Labor::LaborExchanges::ProcessCompletedAssignment.new(
        labor_exchange_repository
      )
    end

    def labor_initialize_exchanges
      @labor_initialize_exchanges ||= Labor::LaborExchanges::InitializeExchanges.new(
        labor_exchange_repository,
        labor_assignment_repository
      )
    end

    # Rest of CleanArch methods...
  end
end
