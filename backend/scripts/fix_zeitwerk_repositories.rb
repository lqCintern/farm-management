#!/usr/bin/env ruby

require 'fileutils'
require 'pathname'

class ZeitwerkRepositoryFixer
  def initialize
    @app_dir = Pathname.new(File.expand_path('../../app', __FILE__))
    @domains_dir = @app_dir.join('domains')
  end

  def fix_all_repositories
    puts "Starting to fix repositories in domains..."
    
    # Tìm tất cả các file repository trong thư mục domains
    Dir.glob(@domains_dir.join('**/repositories/*.rb')).each do |file_path|
      fix_repository_file(file_path)
    end
    
    puts "Finished fixing repositories."
  end

  private

  def fix_repository_file(file_path)
    puts "Processing: #{file_path}"
    
    content = File.read(file_path)
    domain_name = extract_domain_name(file_path)
    
    # Kiểm tra xem file có cấu trúc namespace ngược không
    if content.include?("module Repositories\n  module #{domain_name}")
      fixed_content = fix_namespace(content, domain_name)
      File.write(file_path, fixed_content)
      puts "Fixed namespace in: #{file_path}"
    else
      puts "No changes needed for: #{file_path}"
    end
  end

  def extract_domain_name(file_path)
    # Lấy tên domain từ đường dẫn file
    # Ví dụ: /app/domains/farming/repositories/farm_activity_repository.rb -> farming
    path = Pathname.new(file_path)
    path.dirname.dirname.basename.to_s.capitalize
  end

  def fix_namespace(content, domain_name)
    # Sửa lại cấu trúc namespace
    content.gsub(
      /module Repositories\n  module #{domain_name}/,
      "module #{domain_name}\n  module Repositories"
    ).gsub(
      /end\nend\s*$/,
      "  end\nend"
    )
  end
end

# Chạy script
fixer = ZeitwerkRepositoryFixer.new
fixer.fix_all_repositories 