# lib/tasks/custom_seeds.rake
namespace :db do
  namespace :seed do
    desc "Tạo mới dữ liệu đổi công với timestamp"
    task reset_labor_exchange: :environment do
      filename = File.join(Rails.root, "db", "seeds", "labor_exchange_reset.rb")
      load(filename) if File.exist?(filename)
    end
  end
end
