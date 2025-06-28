import { useEffect, useState } from 'react';
import { getMyHarvests } from '@/services/marketplace/harvestService';
import { Link } from 'react-router-dom';

export default function MyHarvestsPage() {
  const [harvests, setHarvests] = useState<any[]>([]);
  useEffect(() => {
    getMyHarvests().then(data => setHarvests(data.harvests));
  }, []);
  return (
    <div>
      <h2>Danh sách lịch thu hoạch</h2>
      <table>
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Ngày thu hoạch</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {harvests.map((h) => (
            <tr key={h.id}>
              <td>{h.product_listing?.title}</td>
              <td>{h.scheduled_date}</td>
              <td>{h.status}</td>
              <td><Link to={`/harvests/${h.id}`}>Chi tiết</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 