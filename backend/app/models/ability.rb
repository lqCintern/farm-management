# frozen_string_literal: true

class Ability
  include CanCan::Ability

  def initialize(user)
    return unless user # Nếu chưa đăng nhập, không có quyền

    # Quyền cho tất cả người dùng
    can :read, FarmMaterial
    can :create, FarmActivity

    # Quyền cho hộ sản xuất
    if user.user_type == 1
      can :manage, FarmMaterial, user_id: user.id
      can :read, FarmActivity, user_id: user.id
      can :update, FarmActivity, user_id: user.id
      can :destroy, FarmActivity, user_id: user.id
    end
  end
end
