#!/usr/bin/env ruby

require 'fileutils'
require 'pathname'

class ZeitwerkPresenterFixer
  def initialize
    @app_dir = Pathname.new(File.expand_path('../../app', __FILE__))
    @domains_dir = @app_dir.join('domains')
  end

  def fix_all_presenters
    puts "Starting to fix presenters in domains..."
    
    # Tìm tất cả các file presenter trong thư mục domains
    Dir.glob(@domains_dir.join('**/presenters/**/*.rb')).each do |file_path|
      fix_presenter_file(file_path)
    end
    
    puts "Finished fixing presenters."
  end

  private

  def fix_presenter_file(file_path)
    puts "Processing: #{file_path}"
    
    content = File.read(file_path)
    domain_name = extract_domain_name(file_path)
    
    # Kiểm tra và sửa các trường hợp namespace không đúng
    if content.include?("module #{domain_name}\n  class") && !content.include?("module #{domain_name}\n  module Presenters")
      fixed_content = fix_domain_presenters(content, domain_name)
      File.write(file_path, fixed_content)
      puts "Fixed namespace in: #{file_path}"
    else
      puts "No changes needed for: #{file_path}"
    end
  end

  def extract_domain_name(file_path)
    # Lấy tên domain từ đường dẫn file
    # Ví dụ: /app/domains/farming/presenters/farm_activity_presenter.rb -> farming
    path = Pathname.new(file_path)
    path.dirname.dirname.dirname.basename.to_s.capitalize
  end

  def fix_domain_presenters(content, domain_name)
    # Sửa lại cấu trúc namespace cho các domain presenters
    content.gsub(
      /module #{domain_name}\n  class/,
      "module #{domain_name}\n  module Presenters\n    class"
    ).gsub(
      /end\nend\s*$/,
      "    end\n  end\nend"
    )
  end
end

# Chạy script
fixer = ZeitwerkPresenterFixer.new
fixer.fix_all_presenters 