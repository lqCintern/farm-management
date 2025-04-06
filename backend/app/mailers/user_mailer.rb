class UserMailer < ApplicationMailer
  default from: "no-reply@example.com"

  def reset_password_email(user)
    @user = user
    @reset_password_url = "http://localhost:5173/reset-password?token=#{@user.reset_password_token}"
    mail(to: @user.email, subject: "Reset Your Password")
  end
end
