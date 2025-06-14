#!/usr/bin/env ruby

require 'fileutils'
require 'pathname'

class NotificationDomainFixer
  def initialize
    @app_dir = Pathname.new(File.expand_path('../../app', __FILE__))
    @domains_dir = @app_dir.join('domains')
    @source_dir = @domains_dir.join('notifications')
    @target_dir = @domains_dir.join('notification')
  end

  def fix_domain_structure
    puts "Starting to fix notification domain structure..."
    
    # Tạo thư mục đích nếu chưa tồn tại
    FileUtils.mkdir_p(@target_dir)
    
    # Di chuyển tất cả các file và thư mục từ notifications sang notification
    if File.exist?(@source_dir)
      Dir.glob(@source_dir.join('**/*')).each do |file|
        next if File.directory?(file)
        
        relative_path = Pathname.new(file).relative_path_from(@source_dir)
        target_path = @target_dir.join(relative_path)
        
        # Tạo thư mục đích nếu cần
        FileUtils.mkdir_p(target_path.dirname)
        
        # Đọc và sửa nội dung file
        content = File.read(file)
        fixed_content = fix_namespace(content)
        
        # Ghi file mới
        File.write(target_path, fixed_content)
        puts "Moved and fixed: #{relative_path}"
      end
      
      # Xóa thư mục cũ
      FileUtils.rm_rf(@source_dir)
      puts "Removed old directory: notifications"
    else
      puts "Source directory not found: notifications"
    end
    
    puts "Finished fixing notification domain structure."
  end

  private

  def fix_namespace(content)
    # Sửa namespace từ Notifications sang Notification
    content.gsub(/module Notifications/, 'module Notification')
  end
end

# Chạy script
fixer = NotificationDomainFixer.new
fixer.fix_domain_structure 