#!/usr/bin/env ruby

require 'fileutils'
require 'pathname'

class ZeitwerkUseCaseFixer
  def initialize
    @app_dir = Pathname.new(File.expand_path('../../app', __FILE__))
    @domains_dir = @app_dir.join('domains')
  end

  def fix_all_use_cases
    puts "Starting to fix use cases in domains..."
    
    # Tìm tất cả các file use case trong thư mục domains
    Dir.glob(@domains_dir.join('**/use_cases/*.rb')).each do |file_path|
      fix_use_case_file(file_path)
    end
    
    puts "Finished fixing use cases."
  end

  private

  def fix_use_case_file(file_path)
    puts "Processing: #{file_path}"
    
    content = File.read(file_path)
    domain_name = extract_domain_name(file_path)
    
    # Kiểm tra và sửa các trường hợp namespace không đúng
    if content.include?("module #{domain_name}\n  class")
      fixed_content = fix_domain_use_cases(content, domain_name)
      File.write(file_path, fixed_content)
      puts "Fixed namespace in: #{file_path}"
    else
      puts "No changes needed for: #{file_path}"
    end
  end

  def extract_domain_name(file_path)
    # Lấy tên domain từ đường dẫn file
    # Ví dụ: /app/domains/notification/use_cases/create_notification.rb -> notification
    path = Pathname.new(file_path)
    path.dirname.dirname.basename.to_s.capitalize
  end

  def fix_domain_use_cases(content, domain_name)
    # Sửa lại cấu trúc namespace cho các domain use cases
    content.gsub(
      /module #{domain_name}\n  class/,
      "module #{domain_name}\n  module UseCases\n    class"
    ).gsub(
      /end\nend\s*$/,
      "    end\n  end\nend"
    )
  end
end

# Chạy script
fixer = ZeitwerkUseCaseFixer.new
fixer.fix_all_use_cases 