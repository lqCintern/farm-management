class Ability
  include CanCan::Ability

  def initialize(user)
    return unless user # Nếu chưa đăng nhập, không có quyền

    case user.user_type
    when "admin"
      # Admin có toàn quyền
      can :manage, :all

    when "farmer"
      # Quyền cho hộ sản xuất
      can :manage, FarmMaterial, user_id: user.id
      can :manage, FarmActivity, user_id: user.id
      can :manage, PineappleCrop, user_id: user.id
      can :read, ProductListing
      can :create, ProductListing, user_id: user.id
      can :update, ProductListing, user_id: user.id
      can :destroy, ProductListing, user_id: user.id
      can :read, SupplyListing
      can :create, SupplyOrder, user_id: user.id

    when "supplier"
      # Quyền cho nhà cung cấp vật tư
      can :manage, SupplyListing, user_id: user.id
      can :read, SupplyOrder, supply_listing: { user_id: user.id }
      can :update, SupplyOrder, supply_listing: { user_id: user.id }
      can :read, SupplierReview, supplier_id: user.id

    when "trader"
      # Quyền cho thương lái
      can :read, ProductListing
      can :create, ProductOrder, user_id: user.id
      can :update, ProductOrder, user_id: user.id
      can :destroy, ProductOrder, user_id: user.id
      can :read, Conversation, sender_id: user.id
      can :read, Conversation, receiver_id: user.id
      can :create, Conversation
      can :create, Message, conversation: { sender_id: user.id }
      can :create, Message, conversation: { receiver_id: user.id }

    else
      # Quyền mặc định cho các user không xác định
      can :read, ProductListing
    end
  end
end
