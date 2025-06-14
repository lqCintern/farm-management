#!/usr/bin/env ruby

require 'fileutils'
require 'pathname'

class SupplyChainModuleFixer
  def initialize
    @app_dir = Pathname.new(File.expand_path('../../app', __FILE__))
    @domains_dir = @app_dir.join('domains')
  end

  def fix_all_modules
    puts "Starting to fix modules in SupplyChain domain..."
    
    # Sửa models
    puts "\nFixing models..."
    Dir.glob(@domains_dir.join('supply_chain/models/*.rb')).each do |file_path|
      fix_module_file(file_path, 'Models')
    end
    
    # Sửa services
    puts "\nFixing services..."
    Dir.glob(@domains_dir.join('supply_chain/services/*.rb')).each do |file_path|
      fix_module_file(file_path, 'Services')
    end
    
    puts "\nFinished fixing modules."
  end

  private

  def fix_module_file(file_path, module_name)
    puts "Processing: #{file_path}"
    
    content = File.read(file_path)
    
    # Kiểm tra xem file đã có module SupplyChain chưa
    if content.include?("module SupplyChain")
      # Kiểm tra xem đã có module Models/Services chưa
      if !content.include?("module #{module_name}")
        fixed_content = add_module(content, module_name)
        File.write(file_path, fixed_content)
        puts "Added #{module_name} module in: #{file_path}"
      else
        puts "No changes needed for: #{file_path}"
      end
    else
      # Thêm cả hai module nếu chưa có
      fixed_content = add_both_modules(content, module_name)
      File.write(file_path, fixed_content)
      puts "Added SupplyChain and #{module_name} modules in: #{file_path}"
    end
  end

  def add_module(content, module_name)
    # Thêm module mới vào sau module SupplyChain
    content.gsub(
      /module SupplyChain\n/,
      "module SupplyChain\n  module #{module_name}\n"
    ).gsub(
      /end\nend\s*$/,
      "  end\nend"
    )
  end

  def add_both_modules(content, module_name)
    # Thêm cả hai module
    "module SupplyChain\n  module #{module_name}\n#{content}\n  end\nend"
  end
end

# Chạy script
fixer = SupplyChainModuleFixer.new
fixer.fix_all_modules 