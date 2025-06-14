#!/usr/bin/env ruby

require 'fileutils'
require 'pathname'

class ZeitwerkModelFixer
  def initialize
    @app_dir = Pathname.new(File.expand_path('../../app', __FILE__))
    @domains_dir = @app_dir.join('domains')
  end

  def fix_all_models
    puts "Starting to fix models in domains..."
    
    # Tìm tất cả các file model trong thư mục domains
    Dir.glob(@domains_dir.join('**/models/*.rb')).each do |file_path|
      fix_model_file(file_path)
    end
    
    puts "Finished fixing models."
  end

  private

  def fix_model_file(file_path)
    puts "Processing: #{file_path}"
    
    content = File.read(file_path)
    domain_name = extract_domain_name(file_path)
    
    # Kiểm tra xem file đã có namespace Models chưa
    if content.include?("module #{domain_name}") && !content.include?("module #{domain_name}\n  module Models")
      fixed_content = fix_namespace(content, domain_name)
      File.write(file_path, fixed_content)
      puts "Fixed namespace in: #{file_path}"
    else
      puts "No changes needed for: #{file_path}"
    end
  end

  def extract_domain_name(file_path)
    # Lấy tên domain từ đường dẫn file
    # Ví dụ: /app/domains/farming/models/field.rb -> farming
    path = Pathname.new(file_path)
    path.dirname.dirname.basename.to_s.capitalize
  end

  def fix_namespace(content, domain_name)
    # Thêm module Models vào namespace
    content.gsub(
      /module #{domain_name}\n\s+class/,
      "module #{domain_name}\n  module Models\n    class"
    ).gsub(
      /end\nend\s*$/,
      "    end\n  end\nend"
    )
  end
end

# Chạy script
fixer = ZeitwerkModelFixer.new
fixer.fix_all_models 