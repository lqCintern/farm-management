#!/usr/bin/env ruby

require 'fileutils'
require 'pathname'

class SupplyChainNamespaceFixer
  def initialize
    @app_dir = Pathname.new(File.expand_path('../../app', __FILE__))
    @domains_dir = @app_dir.join('domains')
  end

  def fix_all_namespaces
    puts "Starting to fix namespaces in SupplyChain domain..."
    
    # Sửa entities
    puts "\nFixing entities..."
    Dir.glob(@domains_dir.join('supply_chain/entities/*.rb')).each do |file_path|
      fix_namespace_file(file_path, 'Entities')
    end
    
    # Sửa repositories
    puts "\nFixing repositories..."
    Dir.glob(@domains_dir.join('supply_chain/repositories/*.rb')).each do |file_path|
      fix_namespace_file(file_path, 'Repositories')
    end
    
    puts "\nFinished fixing namespaces."
  end

  private

  def fix_namespace_file(file_path, module_name)
    puts "Processing: #{file_path}"
    
    content = File.read(file_path)
    
    # Kiểm tra và sửa các trường hợp namespace không đúng
    if content.include?("module #{module_name}\n  module SupplyChain")
      fixed_content = fix_namespace(content, module_name)
      File.write(file_path, fixed_content)
      puts "Fixed namespace in: #{file_path}"
    else
      puts "No changes needed for: #{file_path}"
    end
  end

  def fix_namespace(content, module_name)
    # Sửa lại cấu trúc namespace
    content.gsub(
      /module #{module_name}\n  module SupplyChain/,
      "module SupplyChain\n  module #{module_name}"
    ).gsub(
      /end\nend\s*$/,
      "  end\nend"
    )
  end
end

# Chạy script
fixer = SupplyChainNamespaceFixer.new
fixer.fix_all_namespaces 