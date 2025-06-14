#!/usr/bin/env ruby

require 'fileutils'
require 'pathname'

class ZeitwerkServiceFixer
  def initialize
    @app_dir = Pathname.new(File.expand_path('../../app', __FILE__))
    @domains_dir = @app_dir.join('domains')
  end

  def fix_all_services
    puts "Starting to fix services in domains..."
    
    # Tìm tất cả các file service trong thư mục domains
    Dir.glob(@domains_dir.join('**/services/*.rb')).each do |file_path|
      fix_service_file(file_path)
    end
    
    puts "Finished fixing services."
  end

  private

  def fix_service_file(file_path)
    puts "Processing: #{file_path}"
    
    content = File.read(file_path)
    domain_name = extract_domain_name(file_path)
    
    # Kiểm tra và sửa các trường hợp namespace không đúng
    if content.include?("module #{domain_name}Services")
      fixed_content = fix_notification_services(content, domain_name)
      File.write(file_path, fixed_content)
      puts "Fixed namespace in: #{file_path}"
    elsif content.include?("module #{domain_name}\n  class")
      fixed_content = fix_domain_services(content, domain_name)
      File.write(file_path, fixed_content)
      puts "Fixed namespace in: #{file_path}"
    else
      puts "No changes needed for: #{file_path}"
    end
  end

  def extract_domain_name(file_path)
    # Lấy tên domain từ đường dẫn file
    # Ví dụ: /app/domains/farming/services/farm_activity_service.rb -> farming
    path = Pathname.new(file_path)
    path.dirname.dirname.basename.to_s.capitalize
  end

  def fix_notification_services(content, domain_name)
    # Sửa lại cấu trúc namespace cho notification services
    content.gsub(
      /module #{domain_name}Services/,
      "module #{domain_name}\n  module Services"
    ).gsub(
      /end\nend\s*$/,
      "  end\nend"
    )
  end

  def fix_domain_services(content, domain_name)
    # Sửa lại cấu trúc namespace cho các domain services
    content.gsub(
      /module #{domain_name}\n  class/,
      "module #{domain_name}\n  module Services\n    class"
    ).gsub(
      /end\nend\s*$/,
      "    end\n  end\nend"
    )
  end
end

# Chạy script
fixer = ZeitwerkServiceFixer.new
fixer.fix_all_services 