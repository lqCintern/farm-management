#!/usr/bin/env ruby

require 'fileutils'
require 'pathname'

class FarmingUseCaseFixer
  def initialize
    @app_dir = Pathname.new(File.expand_path('../../app', __FILE__))
    @domains_dir = @app_dir.join('domains')
  end

  def fix_all_use_cases
    puts "Starting to fix use cases in Farming domain..."
    
    # Tìm tất cả các file use case trong thư mục farming/use_cases
    Dir.glob(@domains_dir.join('farming/use_cases/**/*.rb')).each do |file_path|
      fix_use_case_file(file_path)
    end
    
    puts "Finished fixing use cases."
  end

  private

  def fix_use_case_file(file_path)
    puts "Processing: #{file_path}"
    
    content = File.read(file_path)
    
    # Kiểm tra và sửa các trường hợp namespace không đúng
    if content.include?("module Farming\n  module") && !content.include?("module UseCases")
      fixed_content = fix_namespace(content)
      File.write(file_path, fixed_content)
      puts "Fixed namespace in: #{file_path}"
    else
      puts "No changes needed for: #{file_path}"
    end
  end

  def fix_namespace(content)
    # Sửa lại cấu trúc namespace cho các use cases
    content.gsub(
      /module Farming\n  module/,
      "module Farming\n  module UseCases\n    module"
    ).gsub(
      /end\nend\s*$/,
      "    end\n  end\nend"
    )
  end
end

# Chạy script
fixer = FarmingUseCaseFixer.new
fixer.fix_all_use_cases 