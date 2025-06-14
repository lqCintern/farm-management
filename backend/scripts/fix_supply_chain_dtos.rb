#!/usr/bin/env ruby

require 'fileutils'
require 'pathname'

class SupplyChainDtosFixer
  def initialize
    @app_dir = Pathname.new(File.expand_path('../../app', __FILE__))
    @domains_dir = @app_dir.join('domains')
  end

  def fix_all_dtos
    puts "Starting to fix DTOs in SupplyChain domain..."
    
    # Tìm tất cả các file DTO trong thư mục supply_chain/dtos
    Dir.glob(@domains_dir.join('supply_chain/dtos/*.rb')).each do |file_path|
      fix_dto_file(file_path)
    end
    
    puts "Finished fixing DTOs."
  end

  private

  def fix_dto_file(file_path)
    puts "Processing: #{file_path}"
    
    content = File.read(file_path)
    
    # Kiểm tra và sửa các trường hợp namespace không đúng
    if content.include?("module Dtos\n  module SupplyChain")
      fixed_content = fix_namespace(content)
      File.write(file_path, fixed_content)
      puts "Fixed namespace in: #{file_path}"
    else
      puts "No changes needed for: #{file_path}"
    end
  end

  def fix_namespace(content)
    # Sửa lại cấu trúc namespace cho các DTOs
    content.gsub(
      /module Dtos\n  module SupplyChain/,
      "module SupplyChain\n  module Dtos"
    ).gsub(
      /end\nend\s*$/,
      "  end\nend"
    )
  end
end

# Chạy script
fixer = SupplyChainDtosFixer.new
fixer.fix_all_dtos 