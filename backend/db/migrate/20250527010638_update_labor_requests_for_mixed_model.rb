class UpdateLaborRequestsForMixedModel < ActiveRecord::Migration[8.0]
  def change
    add_column :labor_requests, :request_group_id, :string, comment: "ID nhóm cho các yêu cầu liên quan"
    add_column :labor_requests, :parent_request_id, :bigint, comment: "ID của yêu cầu gốc trong nhóm"
    add_column :labor_requests, :is_public, :boolean, default: false, comment: "Yêu cầu có thể được xem bởi tất cả"
    add_column :labor_requests, :max_acceptors, :integer, null: true, comment: "Số lượng tối đa household được chấp nhận"
    
    add_index :labor_requests, :request_group_id
    add_index :labor_requests, :parent_request_id
    add_index :labor_requests, :is_public
    
    add_foreign_key :labor_requests, :labor_requests, column: :parent_request_id
  end
end
