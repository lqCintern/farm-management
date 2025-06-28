import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getHarvestDetail, updateHarvestStatus } from '@/services/marketplace/harvestService';

export default function HarvestDetailPage() {
  const { id } = useParams();
  const [harvest, setHarvest] = useState<any>(null);

  useEffect(() => {
    getHarvestDetail(id as string).then(setHarvest);
  }, [id]);

  const handleStatusChange = (status: string) => {
    updateHarvestStatus(id as string, { status }).then(res => setHarvest(res.harvest));
  };

  if (!harvest) return <div>Loading...</div>;
  return (
    <div>
      <h2>Chi tiết lịch thu hoạch</h2>
      <div>Sản phẩm: {harvest.product_listing?.title}</div>
      <div>Ngày thu hoạch: {harvest.scheduled_date}</div>
      <div>Trạng thái: {harvest.status}</div>
      <div>
        <button onClick={() => handleStatusChange('harvesting')}>Bắt đầu thu hoạch</button>
        <button onClick={() => handleStatusChange('completed')}>Hoàn thành</button>
        <button onClick={() => handleStatusChange('cancelled')}>Hủy</button>
      </div>
      {harvest.farm_activity_id && (
        <div>
          <Link to={`/farm-activities/${harvest.farm_activity_id}`}>Xem hoạt động đồng ruộng</Link>
        </div>
      )}
    </div>
  );
} 