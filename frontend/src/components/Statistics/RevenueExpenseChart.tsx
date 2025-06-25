import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

interface RevenueExpenseChartProps {
  data: {
    monthly_data: any[];
  };
}

export default function RevenueExpenseChart({ data }: RevenueExpenseChartProps) {
  if (!data?.monthly_data?.length) return null;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Doanh thu và Chi phí theo thời gian</h2>
      </div>
      
      <div className="p-6">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.monthly_data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <ReferenceLine y={0} stroke="#000" />
              <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#4CAF50" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" name="Chi phí" stroke="#F44336" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#2196F3" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}