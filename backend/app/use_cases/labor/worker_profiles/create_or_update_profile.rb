module Labor
  module WorkerProfiles
    class CreateOrUpdateProfile
      def initialize(repository)
        @repository = repository
      end
      
      def execute(user, params)
        worker_profile_entity = Entities::Labor::WorkerProfile.new(
          user_id: user.id,
          skills: params[:skills],
          daily_rate: params[:daily_rate],
          hourly_rate: params[:hourly_rate],
          availability: params[:availability]
        )
        
        @repository.create(worker_profile_entity)
      end
    end
  end
end