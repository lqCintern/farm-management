# Template Activity Materials Management

## Tổng quan

Hệ thống quản lý vật tư cho các mẫu hoạt động nông nghiệp (Pineapple Activity Templates) cho phép:

- Thêm, sửa, xóa vật tư trong từng mẫu hoạt động
- Kiểm tra tính khả thi của mẫu dựa trên kho vật tư hiện có
- Thống kê chi phí ước tính cho từng mẫu
- Quản lý batch operations (thêm/xóa nhiều vật tư cùng lúc)
- Tổng quan vật tư cho tất cả templates

## Components

### 1. TemplateMaterialsManager

Component chính để quản lý vật tư trong một template cụ thể.

**Tính năng:**
- Hiển thị danh sách vật tư với thông tin chi tiết
- Thêm/sửa/xóa vật tư
- Batch operations (xóa nhiều vật tư)
- Thống kê real-time (tổng vật tư, chi phí, tính khả thi)
- Alert khi template không khả thi
- Tích hợp với kho vật tư hiện có

**Props:**
```typescript
interface TemplateMaterialsManagerProps {
  templateId: number;        // ID của template
  templateName?: string;     // Tên template (optional)
  readOnly?: boolean;        // Chế độ chỉ đọc (optional)
}
```

**Sử dụng:**
```tsx
<TemplateMaterialsManager
  templateId={1}
  templateName="Bón phân lần 1"
  readOnly={false}
/>
```

### 2. MaterialsOverview

Component hiển thị tổng quan vật tư cho tất cả templates.

**Tính năng:**
- Thống kê tổng quan (tổng templates, vật tư, chi phí)
- Bảng chi tiết vật tư theo từng template
- Hiển thị tính khả thi và vật tư thiếu
- Alert cho các vấn đề về vật tư

**Props:**
```typescript
interface MaterialsOverviewProps {
  templateIds: number[];     // Danh sách ID templates
  onRefresh?: () => void;    // Callback refresh (optional)
}
```

**Sử dụng:**
```tsx
<MaterialsOverview
  templateIds={[1, 2, 3, 4]}
  onRefresh={() => fetchTemplates()}
/>
```

## Service

### templateMaterialService

Service cung cấp các API để tương tác với backend.

**Các methods chính:**

```typescript
// CRUD operations
getTemplateMaterials(templateId, params)
getTemplateMaterial(templateId, materialId)
addMaterialToTemplate(templateId, materialData)
updateTemplateMaterial(templateId, materialId, materialData)
removeMaterialFromTemplate(templateId, materialId)

// Batch operations
addMaterialsToTemplate(templateId, materials)
updateTemplateMaterials(templateId, materials)
removeMaterialsFromTemplate(templateId, materialIds)

// Statistics & Analysis
getTemplateMaterialStats(templateId)
checkTemplateFeasibility(templateId)
compareWithInventory(templateId)

// Available materials
getAvailableMaterials(params)
```

## Workflow

### 1. Tạo/Sửa Template
- User tạo hoặc sửa template hoạt động
- Trong tab "Vật tư", user có thể thêm vật tư cần thiết
- Hệ thống kiểm tra tính khả thi real-time

### 2. Quản lý Vật tư
- User chọn vật tư từ kho hiện có
- Nhập số lượng yêu cầu và ghi chú
- Hệ thống tính toán chi phí ước tính

### 3. Kiểm tra Tính khả thi
- Hệ thống so sánh với kho vật tư
- Hiển thị alert nếu thiếu vật tư
- Đề xuất vật tư cần bổ sung

### 4. Tổng quan
- Tab "Tổng quan vật tư" hiển thị thống kê tổng thể
- Theo dõi tính khả thi của tất cả templates
- Quản lý chi phí ước tính

## Integration

### Với ActivityTemplateForm
- Tab "Vật tư" được thêm vào form
- Chỉ hiển thị khi đang edit template (có template.id)

### Với ActivityTemplateDetail
- Tab "Vật tư" hiển thị materials của template
- Read-only cho template mặc định

### Với trang chính PineappleActivityTemplates
- Cột "Vật tư" hiển thị số lượng và chi phí
- Tab "Tổng quan vật tư" cho thống kê tổng thể

## Error Handling

- Validation cho số lượng vật tư (phải > 0)
- Kiểm tra quyền sở hữu template
- Xử lý lỗi network và API
- Fallback cho dữ liệu không có

## Performance

- Lazy loading cho materials data
- Caching stats để tránh API calls không cần thiết
- Batch operations để tối ưu performance
- Debounced search và filter

## Future Enhancements

- Import/Export materials từ Excel
- Template materials library
- Auto-suggestions dựa trên loại hoạt động
- Integration với suppliers
- Material cost tracking theo thời gian 