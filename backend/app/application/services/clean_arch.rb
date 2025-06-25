module Services
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
          UseCases::Marketplace::ProductListings::ListProducts.new(
            marketplace_product_listing_repository
          )
      end

      def marketplace_get_product_details
        @marketplace_get_product_details ||=
          UseCases::Marketplace::ProductListings::GetProductDetails.new(
            marketplace_product_listing_repository
          )
      end

      def marketplace_create_product_listing
        @marketplace_create_product_listing ||=
          UseCases::Marketplace::ProductListings::CreateProductListing.new(
            marketplace_product_listing_repository
          )
      end

      def marketplace_update_product_listing
        @marketplace_update_product_listing ||=
          UseCases::Marketplace::ProductListings::UpdateProductListing.new(
            marketplace_product_listing_repository
          )
      end

      def marketplace_change_product_status
        @marketplace_change_product_status ||=
          UseCases::Marketplace::ProductListings::ChangeProductStatus.new(
            marketplace_product_listing_repository
          )
      end

      # Thêm use cases cho MarketplaceHarvests
      def marketplace_list_harvests
        @marketplace_list_harvests ||=
          UseCases::Marketplace::MarketplaceHarvests::ListHarvests.new(
            marketplace_harvest_repository
          )
      end

      def marketplace_get_harvest_details
        @marketplace_get_harvest_details ||=
          UseCases::Marketplace::MarketplaceHarvests::GetHarvestDetails.new(
            marketplace_harvest_repository
          )
      end

      def marketplace_create_harvest
        @marketplace_create_harvest ||=
          UseCases::Marketplace::MarketplaceHarvests::CreateHarvest.new(
            marketplace_harvest_repository,
            marketplace_product_listing_repository
          )
      end

      def marketplace_update_harvest
        @marketplace_update_harvest ||=
          UseCases::Marketplace::MarketplaceHarvests::UpdateHarvest.new(
            marketplace_harvest_repository
          )
      end

      def marketplace_process_payment
        @marketplace_process_payment ||=
          UseCases::Marketplace::MarketplaceHarvests::ProcessPayment.new(
            marketplace_harvest_repository
          )
      end

      def marketplace_delete_harvest
        @marketplace_delete_harvest ||=
          UseCases::Marketplace::MarketplaceHarvests::DeleteHarvest.new(
            marketplace_harvest_repository
          )
      end

      def marketplace_get_active_by_product
        @marketplace_get_active_by_product ||=
          UseCases::Marketplace::MarketplaceHarvests::GetActiveByProduct.new(
            marketplace_harvest_repository
          )
      end

      def marketplace_list_my_listings
        @marketplace_list_my_listings ||=
          UseCases::Marketplace::ProductListings::ListMyListings.new(
            marketplace_product_listing_repository
          )
      end

      # Use case methods
      def marketplace_list_orders
        @marketplace_list_orders ||= UseCases::Marketplace::ProductOrders::ListOrders.new(
          marketplace_product_order_repository
        )
      end

      def marketplace_get_order_details
        @marketplace_get_order_details ||= UseCases::Marketplace::ProductOrders::GetOrderDetails.new(
          marketplace_product_order_repository
        )
      end

      def marketplace_create_order
        @marketplace_create_order ||= UseCases::Marketplace::ProductOrders::CreateOrder.new(
          marketplace_product_order_repository,
          marketplace_product_listing_repository
        )
      end

      def marketplace_update_order_status
        @marketplace_update_order_status ||= UseCases::Marketplace::ProductOrders::UpdateOrderStatus.new(
          marketplace_product_order_repository,
          marketplace_product_listing_repository,
          nil,
          notification_service,
          nil
        )
      end

      def marketplace_update_order_details
        @marketplace_update_order_details ||= UseCases::Marketplace::ProductOrders::UpdateOrderDetails.new(
          marketplace_product_order_repository
        )
      end

      def self.marketplace_update_harvest_status
        UseCases::Marketplace::MarketplaceHarvests::UpdateMarketplaceHarvestStatus.new(
          Repositories::Marketplace::MarketplaceHarvestRepository.new,
          Repositories::Farming::HarvestRepository.new
        )
      end

      # Notification repository
      def notification_repository
        @notification_repository ||= Repositories::Notification::NotificationRepository.new
      end

      # Notification use cases
      def notification_list
        @notification_list ||= UseCases::Notification::ListNotifications.new(notification_repository)
      end

      def notification_get_details
        @notification_get_details ||= UseCases::Notification::GetNotificationDetails.new(notification_repository)
      end

      def notification_mark_as_read
        @notification_mark_as_read ||= UseCases::Notification::MarkAsRead.new(notification_repository)
      end

      def notification_mark_as_unread
        @notification_mark_as_unread ||= UseCases::Notification::MarkAsUnread.new(notification_repository)
      end

      def notification_mark_all_as_read
        @notification_mark_all_as_read ||= UseCases::Notification::MarkAllAsRead.new(notification_repository)
      end

      def notification_get_unread_count
        @notification_get_unread_count ||= UseCases::Notification::GetUnreadCount.new(notification_repository)
      end

      def notification_create
        @notification_create ||= UseCases::Notification::CreateNotification.new(notification_repository)
      end

      def notification_delete
        @notification_delete ||= UseCases::Notification::DeleteNotification.new(notification_repository)
      end

      def prepare_labor_notification
        @prepare_labor_notification ||= UseCases::Notification::PrepareLaborRequestNotification.new(
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
        @farming_get_pineapple_crop ||= UseCases::Farming::PineappleCrops::GetPineappleCrop.new(
          farming_pineapple_crop_repository
        )
      end

      def farming_list_pineapple_crops
        @farming_list_pineapple_crops ||= UseCases::Farming::PineappleCrops::ListPineappleCrops.new(
          farming_pineapple_crop_repository,
          pagination_service
        )
      end

      def farming_create_pineapple_crop
        @farming_create_pineapple_crop ||= UseCases::Farming::PineappleCrops::CreatePineappleCrop.new(
          farming_pineapple_crop_repository,
          farming_plan_generator_service
        )
      end

      def farming_update_pineapple_crop
        @farming_update_pineapple_crop ||= UseCases::Farming::PineappleCrops::UpdatePineappleCrop.new(
          farming_pineapple_crop_repository
        )
      end

      def farming_delete_pineapple_crop
        @farming_delete_pineapple_crop ||= UseCases::Farming::PineappleCrops::DeletePineappleCrop.new(
          farming_pineapple_crop_repository
        )
      end

      def farming_generate_pineapple_plan
        @farming_generate_pineapple_plan ||= UseCases::Farming::PineappleCrops::GeneratePineapplePlan.new(
          farming_pineapple_crop_repository
        )
      end

      def farming_advance_stage
        @farming_advance_stage ||= UseCases::Farming::PineappleCrops::AdvanceStage.new(
          farming_pineapple_crop_repository
        )
      end

      def farming_record_harvest
        @farming_record_harvest ||= UseCases::Farming::PineappleCrops::RecordHarvest.new(
          farming_pineapple_crop_repository
        )
      end

      def farming_preview_plan
        @farming_preview_plan ||= UseCases::Farming::PineappleCrops::PreviewPlan.new(
          farming_pineapple_crop_repository
        )
      end

      def farming_confirm_plan
        @farming_confirm_plan ||= UseCases::Farming::PineappleCrops::ConfirmPlan.new(
          farming_pineapple_crop_repository
        )
      end

      def farming_clean_activities
        @farming_clean_activities ||= UseCases::Farming::PineappleCrops::CleanActivities.new(
          farming_pineapple_crop_repository
        )
      end

      def farming_get_statistics
        @farming_get_statistics ||= UseCases::Farming::PineappleCrops::GetStatistics.new(
          farming_pineapple_crop_repository
        )
      end

      def farming_plan_generator_service
        @farming_plan_generator_service ||= UseCases::Farming::PlanGeneratorService.new
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
        @farming_list_farm_activities ||= UseCases::Farming::FarmActivities::ListFarmActivities.new(
          farming_farm_activity_repository
        )
      end

      def farming_get_farm_activity
        @farming_get_farm_activity ||= UseCases::Farming::FarmActivities::GetFarmActivity.new(
          farming_farm_activity_repository
        )
      end

      def farming_create_farm_activity
        @farming_create_farm_activity ||= UseCases::Farming::FarmActivities::CreateFarmActivity.new(
          farming_farm_activity_repository,
          farming_farm_activity_notification_service
        )
      end

      def farming_update_farm_activity
        @farming_update_farm_activity ||= UseCases::Farming::FarmActivities::UpdateFarmActivity.new(
          farming_farm_activity_repository,
          farming_farm_activity_notification_service
        )
      end

      def farming_delete_farm_activity
        @farming_delete_farm_activity ||= UseCases::Farming::FarmActivities::DeleteFarmActivity.new(
          farming_farm_activity_repository
        )
      end

      def farming_complete_farm_activity
        @farming_complete_farm_activity ||= UseCases::Farming::FarmActivities::CompleteFarmActivity.new(
          farming_farm_activity_repository,
          farming_farm_activity_notification_service
        )
      end

      def farming_get_stage_activities
        @farming_get_stage_activities ||= UseCases::Farming::FarmActivities::GetStageActivities.new(
          farming_farm_activity_repository
        )
      end

      def farming_check_upcoming_activities
        @farming_check_upcoming_activities ||= UseCases::Farming::FarmActivities::CheckUpcomingActivities.new(
          farming_farm_activity_repository,
          farming_farm_activity_notification_service
        )
      end

      def farming_get_farm_activity_stats
        @farming_get_farm_activity_stats ||= UseCases::Farming::FarmActivities::GetFarmActivityStats.new(
          farming_farm_activity_repository,
          farming_farm_activity_stats_service
        )
      end

      def farming_get_farm_activity_history_by_field
        @farming_get_farm_activity_history_by_field ||= UseCases::Farming::FarmActivities::GetFarmActivityHistoryByField.new(
          farming_farm_activity_repository
        )
      end

      # Farm Material Repositories
      def farming_farm_material_repository
        @farming_farm_material_repository ||= Repositories::Farming::FarmMaterialRepository.new
      end

      # Farm Material Use Cases
      def farming_list_farm_materials
        @farming_list_farm_materials ||= UseCases::Farming::FarmMaterials::ListFarmMaterials.new(
          farming_farm_material_repository
        )
      end

      def farming_get_farm_material
        @farming_get_farm_material ||= UseCases::Farming::FarmMaterials::GetFarmMaterial.new(
          farming_farm_material_repository
        )
      end

      def farming_create_farm_material
        @farming_create_farm_material ||= UseCases::Farming::FarmMaterials::CreateFarmMaterial.new(
          farming_farm_material_repository
        )
      end

      def farming_update_farm_material
        @farming_update_farm_material ||= UseCases::Farming::FarmMaterials::UpdateFarmMaterial.new(
          farming_farm_material_repository
        )
      end

      def farming_delete_farm_material
        @farming_delete_farm_material ||= UseCases::Farming::FarmMaterials::DeleteFarmMaterial.new(
          farming_farm_material_repository
        )
      end

      def self.farming_get_farm_material_details
        UseCases::Farming::FarmMaterials::GetFarmMaterialDetails.new(
          farming_farm_material_repository
        )
      end

      # Repositories
      def farming_pineapple_activity_template_repository
        @farming_pineapple_activity_template_repository ||= Repositories::Farming::PineappleActivityTemplateRepository.new
      end

      # Use Cases
      def farming_list_pineapple_activity_templates
        @farming_list_pineapple_activity_templates ||= UseCases::Farming::PineappleActivityTemplates::ListPineappleActivityTemplates.new(
          farming_pineapple_activity_template_repository
        )
      end

      def farming_get_pineapple_activity_template
        @farming_get_pineapple_activity_template ||= UseCases::Farming::PineappleActivityTemplates::GetPineappleActivityTemplate.new(
          farming_pineapple_activity_template_repository
        )
      end

      def farming_create_pineapple_activity_template
        @farming_create_pineapple_activity_template ||= UseCases::Farming::PineappleActivityTemplates::CreatePineappleActivityTemplate.new(
          farming_pineapple_activity_template_repository
        )
      end

      def farming_update_pineapple_activity_template
        @farming_update_pineapple_activity_template ||= UseCases::Farming::PineappleActivityTemplates::UpdatePineappleActivityTemplate.new(
          farming_pineapple_activity_template_repository
        )
      end

      def farming_delete_pineapple_activity_template
        @farming_delete_pineapple_activity_template ||= UseCases::Farming::PineappleActivityTemplates::DeletePineappleActivityTemplate.new(
          farming_pineapple_activity_template_repository
        )
      end

      def farming_apply_template_to_activities
        @farming_apply_template_to_activities ||= UseCases::Farming::PineappleActivityTemplates::ApplyTemplateToActivities.new(
          farming_pineapple_activity_template_repository
        )
      end

      # Repositories
      def farming_field_repository
        @farming_field_repository ||= Repositories::Farming::FieldRepository.new
      end

      # Use Cases
      def farming_list_fields
        @farming_list_fields ||= UseCases::Farming::Fields::ListFields.new(
          farming_field_repository
        )
      end

      def farming_get_field
        @farming_get_field ||= UseCases::Farming::Fields::GetField.new(
          farming_field_repository
        )
      end

      def farming_create_field
        @farming_create_field ||= UseCases::Farming::Fields::CreateField.new(
          farming_field_repository
        )
      end

      def farming_update_field
        @farming_update_field ||= UseCases::Farming::Fields::UpdateField.new(
          farming_field_repository
        )
      end

      def farming_delete_field
        @farming_delete_field ||= UseCases::Farming::Fields::DeleteField.new(
          farming_field_repository
        )
      end

      def farming_get_field_activities
        @farming_get_field_activities ||= UseCases::Farming::Fields::GetFieldActivities.new(
          farming_field_repository
        )
      end

      def farming_get_field_harvests
        @farming_get_field_harvests ||= UseCases::Farming::Fields::GetFieldHarvests.new(
          farming_field_repository
        )
      end

      def farming_get_field_pineapple_crops
        @farming_get_field_pineapple_crops ||= UseCases::Farming::Fields::GetFieldPineappleCrops.new(
          farming_field_repository
        )
      end

      def farming_get_field_stats
        @farming_get_field_stats ||= UseCases::Farming::Fields::GetFieldStats.new(
          farming_field_repository
        )
      end

      # Repositories
      def farming_harvest_repository
        @farming_harvest_repository ||= Repositories::Farming::HarvestRepository.new
      end

      # Use Cases
      def farming_list_harvests
        @farming_list_harvests ||= UseCases::Farming::Harvests::ListHarvests.new(
          farming_harvest_repository
        )
      end

      def farming_get_harvest
        @farming_get_harvest ||= UseCases::Farming::Harvests::GetHarvest.new(
          farming_harvest_repository
        )
      end

      def farming_get_harvests_by_crop
        @farming_get_harvests_by_crop ||= UseCases::Farming::Harvests::GetHarvestsByCrop.new(
          farming_harvest_repository
        )
      end

      def farming_get_harvests_by_field
        @farming_get_harvests_by_field ||= UseCases::Farming::Harvests::GetHarvestsByField.new(
          farming_harvest_repository
        )
      end

      def farming_create_harvest
        @farming_create_harvest ||= UseCases::Farming::Harvests::CreateHarvest.new(
          farming_harvest_repository
        )
      end

      def farming_update_harvest
        @farming_update_harvest ||= UseCases::Farming::Harvests::UpdateHarvest.new(
          farming_harvest_repository
        )
      end

      def farming_delete_harvest
        @farming_delete_harvest ||= UseCases::Farming::Harvests::DeleteHarvest.new(
          farming_harvest_repository
        )
      end

      def farming_get_harvest_stats
        @farming_get_harvest_stats ||= UseCases::Farming::Harvests::GetHarvestStats.new(
          farming_harvest_repository
        )
      end

      # Labor Farm Household repositories
      def labor_farm_household_repository
        @labor_farm_household_repository ||= Repositories::Labor::FarmHouseholdRepository.new
      end

      # Labor Farm Household use cases
      def labor_list_farm_households
        @labor_list_farm_households ||= UseCases::Labor::FarmHouseholds::ListFarmHouseholds.new(
          labor_farm_household_repository
        )
      end

      def labor_get_household_summary
        @labor_get_household_summary ||= UseCases::Labor::FarmHouseholds::GetHouseholdSummary.new(
          labor_farm_household_repository
        )
      end

      def labor_create_farm_household
        @labor_create_farm_household ||= UseCases::Labor::FarmHouseholds::CreateFarmHousehold.new(
          labor_farm_household_repository
        )
      end

      def labor_update_farm_household
        @labor_update_farm_household ||= UseCases::Labor::FarmHouseholds::UpdateFarmHousehold.new(
          labor_farm_household_repository
        )
      end

      def labor_delete_farm_household
        @labor_delete_farm_household ||= UseCases::Labor::FarmHouseholds::DeleteFarmHousehold.new(
          labor_farm_household_repository
        )
      end

      def labor_add_worker_to_household
        @labor_add_worker_to_household ||= UseCases::Labor::FarmHouseholds::AddWorkerToHousehold.new(
          labor_farm_household_repository
        )
      end

      # Labor Assignment repository
      def labor_assignment_repository
        @labor_assignment_repository ||= Repositories::Labor::LaborAssignmentRepository.new
      end

      # Labor Assignment use cases
      def labor_create_assignment
        @labor_create_assignment ||= UseCases::Labor::LaborAssignments::CreateAssignment.new(
          labor_assignment_repository
        )
      end

      def labor_batch_assign_workers
        @labor_batch_assign_workers ||= UseCases::Labor::LaborAssignments::BatchAssignWorkers.new(
          labor_assignment_repository
        )
      end

      def labor_update_assignment_status
        @labor_update_assignment_status ||= UseCases::Labor::LaborAssignments::UpdateAssignmentStatus.new(
          labor_assignment_repository
        )
      end

      def labor_list_worker_assignments
        @labor_list_worker_assignments ||= UseCases::Labor::LaborAssignments::ListWorkerAssignments.new(
          labor_assignment_repository
        )
      end

      def labor_list_household_assignments
        @labor_list_household_assignments ||= UseCases::Labor::LaborAssignments::ListHouseholdAssignments.new(
          labor_assignment_repository
        )
      end

      def labor_complete_multiple_assignments
        @labor_complete_multiple_assignments ||= UseCases::Labor::LaborAssignments::CompleteMultipleAssignments.new(
          labor_assignment_repository
        )
      end

      def labor_rate_assignment
        @labor_rate_assignment ||= UseCases::Labor::LaborAssignments::RateAssignment.new(
          labor_assignment_repository
        )
      end

      def labor_check_scheduling
        @labor_check_scheduling ||= UseCases::Labor::LaborAssignments::CheckScheduling.new(
          labor_assignment_repository
        )
      end

      def labor_list_request_assignments
        @labor_list_request_assignments ||= UseCases::Labor::LaborAssignments::ListRequestAssignments.new(
          labor_assignment_repository
        )
      end

      def labor_delete_assignment
        @labor_delete_assignment ||= UseCases::Labor::LaborAssignments::DeleteAssignment.new(
          labor_assignment_repository
        )
      end

      def labor_get_assignment
        @labor_get_assignment ||= UseCases::Labor::LaborAssignments::GetAssignment.new(
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
        @labor_list_household_workers ||= UseCases::Labor::HouseholdWorkers::ListHouseholdWorkers.new(
          labor_household_worker_repository
        )
      end

      def labor_add_worker_to_household
        @labor_add_worker_to_household ||= UseCases::Labor::HouseholdWorkers::AddWorkerToHousehold.new(
          labor_household_worker_repository
        )
      end

      def labor_remove_worker
        @labor_remove_worker ||= UseCases::Labor::HouseholdWorkers::RemoveWorker.new(
          labor_household_worker_repository,
          labor_farm_household_repository
        )
      end

      def labor_update_worker_status
        @labor_update_worker_status ||= UseCases::Labor::HouseholdWorkers::UpdateWorkerStatus.new(
          labor_household_worker_repository,
          labor_farm_household_repository
        )
      end

      # Worker Profile use cases
      def labor_create_or_update_profile
        @labor_create_or_update_profile ||= UseCases::Labor::WorkerProfiles::CreateOrUpdateProfile.new(
          labor_worker_profile_repository
        )
      end

      def labor_find_available_workers
        @labor_find_available_workers ||= UseCases::Labor::WorkerProfiles::FindAvailableWorkers.new(
          labor_worker_profile_repository
        )
      end

      def labor_get_worker_statistics
        @labor_get_worker_statistics ||= UseCases::Labor::WorkerProfiles::GetWorkerStatistics.new(
          labor_worker_profile_repository
        )
      end

      def labor_get_or_create_profile
        @labor_get_or_create_profile ||= UseCases::Labor::WorkerProfiles::GetOrCreateProfile.new(
          labor_worker_profile_repository
        )
      end

      def labor_check_worker_availability
        @labor_check_worker_availability ||= UseCases::Labor::WorkerProfiles::CheckWorkerAvailability.new(
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
        @labor_list_requests ||= UseCases::Labor::LaborRequests::ListRequests.new(
          labor_request_repository
        )
      end

      def labor_get_request
        @labor_get_request ||= UseCases::Labor::LaborRequests::GetRequest.new(
          labor_request_repository
        )
      end

      def labor_create_request
        @labor_create_request ||= UseCases::Labor::LaborRequests::CreateRequest.new(
          labor_request_repository,
          labor_farm_household_repository
        )
      end

      def labor_update_request
        @labor_update_request ||= UseCases::Labor::LaborRequests::UpdateRequest.new(
          labor_request_repository,
          labor_farm_household_repository
        )
      end

      def labor_delete_request
        @labor_delete_request ||= UseCases::Labor::LaborRequests::DeleteRequest.new(
          labor_request_repository,
          labor_farm_household_repository,
          labor_assignment_repository
        )
      end

      def labor_process_request
        @labor_process_request ||= UseCases::Labor::LaborRequests::ProcessLaborRequest.new(
          labor_request_repository,
          labor_farm_household_repository,
          labor_assignment_repository,
          notification_service
        )
      end

      def labor_list_public_requests
        @labor_list_public_requests ||= UseCases::Labor::LaborRequests::ListPublicRequests.new(
          labor_request_repository
        )
      end

      def labor_join_request
        @labor_join_request ||= UseCases::Labor::LaborRequests::JoinRequest.new(
          labor_request_repository,
          labor_farm_household_repository
        )
      end

          def labor_create_mixed_request
        @labor_create_mixed_request ||= UseCases::Labor::LaborRequests::CreateMixedRequest.new(
          labor_request_repository,
          labor_farm_household_repository
        )
      end

      def labor_get_group_status
        @labor_get_group_status ||= UseCases::Labor::LaborRequests::GetGroupStatus.new(
          labor_request_repository
        )
      end

      def labor_suggest_workers
        @labor_suggest_workers ||= UseCases::Labor::LaborRequests::SuggestWorkers.new(
          labor_request_repository,
          labor_worker_profile_repository
        )
      end

      def labor_list_requests_by_activity
        @labor_list_requests_by_activity ||= UseCases::Labor::LaborRequests::ListRequestsByActivity.new(
          labor_request_repository
        )
      end

      # Labor Exchange use cases
      def labor_list_household_exchanges
        @labor_list_household_exchanges ||= UseCases::Labor::LaborExchanges::ListHouseholdExchanges.new(
          labor_exchange_repository
        )
      end

      def labor_get_exchange_details
        @labor_get_exchange_details ||= UseCases::Labor::LaborExchanges::GetExchangeDetails.new(
          labor_exchange_repository
        )
      end

      def labor_reset_balance
        @labor_reset_balance ||= UseCases::Labor::LaborExchanges::ResetBalance.new(
          labor_exchange_repository,
          labor_farm_household_repository
        )
      end

      def labor_get_transaction_history
        @labor_get_transaction_history ||= UseCases::Labor::LaborExchanges::GetTransactionHistory.new(
          labor_exchange_repository
        )
      end

      def labor_adjust_balance
        @labor_adjust_balance ||= UseCases::Labor::LaborExchanges::AdjustBalance.new(
          labor_exchange_repository,
          labor_farm_household_repository
        )
      end

      def labor_recalculate_balance
        @labor_recalculate_balance ||= UseCases::Labor::LaborExchanges::RecalculateBalance.new(
          labor_exchange_repository
        )
      end

      def labor_process_completed_assignment
        @labor_process_completed_assignment ||= UseCases::Labor::LaborExchanges::ProcessCompletedAssignment.new(
          labor_exchange_repository
        )
      end

      def labor_initialize_exchanges
        @labor_initialize_exchanges ||= UseCases::Labor::LaborExchanges::InitializeExchanges.new(
          labor_exchange_repository,
          labor_assignment_repository
        )
      end

      # Supply Chain Repositories
      def supply_listing_repository
        @supply_listing_repository ||= Repositories::SupplyChain::SupplyListingRepository.new
      end

      def supply_image_repository
        @supply_image_repository ||= Repositories::SupplyChain::SupplyImageRepository.new
      end

      # Supply Chain - FarmerSupplyListings (Public listings)
      def supply_list_listings
        @supply_list_listings ||= UseCases::SupplyChain::SupplyListings::ListSupplyListings.new(
          supply_listing_repository
        )
      end

      def supply_get_listing_details
        @supply_get_listing_details ||= UseCases::SupplyChain::SupplyListings::GetSupplyListingDetails.new(
          supply_listing_repository
        )
      end

      def supply_get_categories
        @supply_get_categories ||= UseCases::SupplyChain::SupplyListings::GetSupplyCategories.new(
          supply_listing_repository
        )
      end

      # Supply Chain - SupplierListings (Supplier management)
      def supplier_list_listings
        @supplier_list_listings ||= UseCases::SupplyChain::SupplierListings::ListSupplierListings.new(
          supply_listing_repository
        )
      end

      def supplier_get_listing_details
        @supplier_get_listing_details ||= UseCases::SupplyChain::SupplierListings::GetSupplierListingDetails.new(
          supply_listing_repository
        )
      end

      def supplier_create_listing
        @supplier_create_listing ||= UseCases::SupplyChain::SupplierListings::CreateSupplierListing.new(
          supply_listing_repository,
          supply_image_repository
        )
      end

      def supplier_update_listing
        @supplier_update_listing ||= UseCases::SupplyChain::SupplierListings::UpdateSupplierListing.new(
          supply_listing_repository,
          supply_image_repository
        )
      end

      def supplier_delete_listing
        @supplier_delete_listing ||= UseCases::SupplyChain::SupplierListings::DeleteSupplierListing.new(
          supply_listing_repository
        )
      end

      def supplier_change_listing_status
        @supplier_change_listing_status ||= UseCases::SupplyChain::SupplierListings::ChangeSupplierListingStatus.new(
          supply_listing_repository
        )
      end

      # Supply Chain Repositories
      def supply_listing_repository
        @supply_listing_repository ||= Repositories::SupplyChain::SupplyListingRepository.new
      end

      def supply_image_repository
        @supply_image_repository ||= Repositories::SupplyChain::SupplyImageRepository.new
      end

      def supplier_review_repository
        @supplier_review_repository ||= Repositories::SupplyChain::SupplierReviewRepository.new
      end

      # Supply Order Repositories
      def supply_order_repository
        @supply_order_repository ||= Repositories::SupplyChain::SupplyOrderRepository.new
      end

      # Supply Orders - Farmer side
      def farmer_list_orders
        @farmer_list_orders ||= UseCases::SupplyChain::SupplyOrders::ListFarmerOrders.new(
          supply_order_repository
        )
      end

      def farmer_get_order_details
        @farmer_get_order_details ||= UseCases::SupplyChain::SupplyOrders::GetFarmerOrderDetails.new(
          supply_order_repository
        )
      end

      def farmer_create_order
        @farmer_create_order ||= UseCases::SupplyChain::SupplyOrders::CreateFarmerOrder.new(
          supply_order_repository,
          supply_listing_repository
        )
      end

      def farmer_cancel_order
        @farmer_cancel_order ||= UseCases::SupplyChain::SupplyOrders::CancelFarmerOrder.new(
          supply_order_repository
        )
      end

      def farmer_complete_order
        @farmer_complete_order ||= UseCases::SupplyChain::SupplyOrders::CompleteFarmerOrder.new(
          supply_order_repository,
          farming_farm_material_repository
        )
      end

      def farmer_complete_order_and_update_inventory
        @farmer_complete_order_and_update_inventory ||= UseCases::SupplyChain::Farmer::CompleteOrderAndUpdateInventory.new(
          supply_order_repository,
          farming_farm_material_repository
        )
      end

      def farmer_update_order
        @farmer_update_order ||= UseCases::SupplyChain::SupplyOrders::UpdateFarmerOrder.new(
          supply_order_repository
        )
      end

      # Supply Orders - Supplier side
      def supplier_list_orders
        @supplier_list_orders ||= UseCases::SupplyChain::SupplyOrders::ListSupplierOrders.new(
          supply_order_repository
        )
      end

      def supplier_get_order_details
        @supplier_get_order_details ||= UseCases::SupplyChain::SupplyOrders::GetSupplierOrderDetails.new(
          supply_order_repository
        )
      end

      def supplier_update_order_status
        @supplier_update_order_status ||= UseCases::SupplyChain::SupplyOrders::UpdateSupplierOrderStatus.new(
          supply_order_repository
        )
      end

      def supplier_get_dashboard
        @supplier_get_dashboard ||= UseCases::SupplyChain::SupplyOrders::GetSupplierDashboard.new(
          supply_order_repository
        )
      end

      # Supplier Review Use Cases
      def create_supplier_review
        @create_supplier_review ||= UseCases::SupplyChain::SupplierReviews::CreateSupplierReview.new(
          supplier_review_repository
        )
      end

      def list_supplier_reviews
        @list_supplier_reviews ||= UseCases::SupplyChain::SupplierReviews::ListSupplierReviews.new(
          supplier_review_repository
        )
      end

      def get_supplier_rating_stats
        @get_supplier_rating_stats ||= UseCases::SupplyChain::SupplierReviews::GetSupplierRatingStats.new(
          supplier_review_repository,
          user_repository
        )
      end

      def user_repository
        @user_repository ||= Repositories::Users::UserRepository.new
      end
    end

    # Repositories
    def self.farming_farm_material_repository
      @farming_farm_material_repository ||= Repositories::Farming::FarmMaterialRepository.new
    end
    
    def self.farming_farm_material_transaction_repository
      @farming_farm_material_transaction_repository ||= Repositories::Farming::FarmMaterialTransactionRepository.new
    end
    
    def self.farming_farm_activity_material_repository
      @farming_farm_activity_material_repository ||= Repositories::Farming::FarmActivityMaterialRepository.new
    end
    
    # Services
    def self.farming_farm_material_inventory_service
      @farming_farm_material_inventory_service ||= Services::Farming::FarmMaterialInventoryService.new(
        farming_farm_material_repository,
        farming_farm_material_transaction_repository
      )
    end
    
    def self.farming_farm_material_statistics_service
      @farming_farm_material_statistics_service ||= Services::Farming::FarmMaterialStatisticsService.new(
        farming_farm_material_repository,
        farming_farm_material_transaction_repository,
        farming_farm_activity_material_repository
      )
    end
    
    # Use Cases
    def self.farmer_complete_order_and_update_inventory
      UseCases::SupplyChain::Farmer::CompleteOrderAndUpdateInventory.new(
        supply_order_repository,
        farming_farm_material_inventory_service
      )
    end
  end
end
