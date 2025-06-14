#!/usr/bin/env ruby

require 'fileutils'
require 'pathname'

class ZeitwerkEntityFixer
  def initialize
    @app_dir = Pathname.new(File.expand_path('../../app', __FILE__))
    @domains_dir = @app_dir.join('domains')
  end

  def fix_all_entities
    puts "Starting to fix entities in domains..."
    
    # Tìm tất cả các file entities trong thư mục domains
    Dir.glob(@domains_dir.join('**/entities/*.rb')).each do |file_path|
      fix_entity_file(file_path)
    end
    
    puts "Finished fixing entities."
  end

  private

  def fix_entity_file(file_path)
    puts "Processing: #{file_path}"
    
    content = File.read(file_path)
    domain_name = extract_domain_name(file_path)
    
    # Kiểm tra và sửa các trường hợp namespace không đúng
    if content.include?("module Entities\n  module #{domain_name}")
      fixed_content = fix_domain_entities(content, domain_name)
      File.write(file_path, fixed_content)
      puts "Fixed namespace in: #{file_path}"
    else
      puts "No changes needed for: #{file_path}"
    end
  end

  def extract_domain_name(file_path)
    # Lấy tên domain từ đường dẫn file
    # Ví dụ: /app/domains/labor/entities/labor_request.rb -> labor
    path = Pathname.new(file_path)
    path.dirname.dirname.basename.to_s.capitalize
  end

  def fix_domain_entities(content, domain_name)
    # Sửa lại cấu trúc namespace cho các domain entities
    content.gsub(
      /module Entities\n  module #{domain_name}/,
      "module #{domain_name}\n  module Entities"
    ).gsub(
      /end\nend\s*$/,
      "  end\nend"
    )
  end
end

# Chạy script
fixer = ZeitwerkEntityFixer.new
fixer.fix_all_entities 