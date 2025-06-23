module UseCases::Labor
  module WorkerProfiles
    class GetOrCreateProfile
      def initialize(repository)
        @repository = repository
      end

      def execute(user)
        profile = @repository.find_by_user_id(user.id)

        unless profile
          result = @repository.create(Entities::Labor::WorkerProfile.new(
            user_id: user.id,
            availability: :available
          ))

          if result[:success]
            return { success: true, profile: result[:profile] }
          else
            return { success: false, errors: result[:errors] }
          end
        end

        { success: true, profile: profile }
      end
    end
  end
end
