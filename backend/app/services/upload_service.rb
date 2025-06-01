# app/services/upload_service.rb
class UploadService
  def self.upload(file, record = nil, attachment_name = nil)
    # Validate file
    raise "File is empty" unless file.present?
    raise "File is too large (max 10MB)" if file.size > 10.megabytes

    # Validate file type
    content_type = file.content_type
    unless content_type.in?(%w[image/jpeg image/png image/jpg video/mp4 video/quicktime])
      raise "Invalid file type. Only JPEG, PNG, and MP4 videos are allowed."
    end

    if record && attachment_name
      # Use Active Storage for direct attachment
      attach_to_record(file, record, attachment_name)

      # Return URL that can be used to access the file
      url_for_attachment(record, attachment_name)
    else
      # Use Active Storage for general purpose uploads
      # Generate unique filename
      filename = "#{SecureRandom.uuid}_#{file.original_filename}"

      # Create a blob and get its URL
      blob = ActiveStorage::Blob.create_and_upload!(
        io: file,
        filename: filename,
        content_type: content_type
      )

      # Return a URL that can be used to retrieve the file
      url_for_blob(blob)
    end
  end

  # Upload multiple files at once
  def self.upload_many(files, record = nil, attachment_name = nil)
    return [] unless files.present?

    files.map do |file|
      upload(file, record, attachment_name)
    end
  end

  # Get URL for a file path (for compatibility with existing code)
  def self.path_to_url(file_path)
    return nil unless file_path.present?

    if file_path.start_with?("http", "//")
      # Already a URL
      file_path
    else
      # Convert local path to URL
      host = Rails.application.routes.default_url_options[:host] || "localhost:3000"
      protocol = Rails.application.routes.default_url_options[:protocol] || "http"

      "#{protocol}://#{host}#{file_path}"
    end
  end

  private

  def self.attach_to_record(file, record, attachment_name)
    # Attach file to record using the specified attachment name
    if attachment_name.to_s.pluralize == attachment_name.to_s
      # It's a has_many_attached relationship
      record.send(attachment_name).attach(file)
    else
      # It's a has_one_attached relationship
      record.send("#{attachment_name}=", file)
    end

    # Save the record to persist the attachment
    record.save!
  end

  def self.url_for_attachment(record, attachment_name)
    attachment = record.send(attachment_name)

    if attachment.is_a?(ActiveStorage::Attached::One) && attachment.attached?
      Rails.application.routes.url_helpers.rails_blob_url(attachment, only_path: false)
    elsif attachment.is_a?(ActiveStorage::Attached::Many) && attachment.attached?
      attachment.last.blob.url
    else
      nil
    end
  end

  def self.url_for_blob(blob)
    Rails.application.routes.url_helpers.rails_blob_url(blob, only_path: false)
  end
end
