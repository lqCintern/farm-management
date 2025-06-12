import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getExchangeTransactionHistory } from '@/services/labor/exchangeService';
import Card from '@/components/common/Card';
import { formatDate } from '@/utils/formatters';
import Pagination from '@/components/common/Pagination';

interface Transaction {
  id: number;
  labor_exchange_id: number;
  labor_assignment_id: number;
  hours: string; // Thay đổi từ number thành string
  description: string;
  created_at: string;
  updated_at: string;
  worker_name: string;
  work_date: string;
  assignment_details?: {
    worker_name: string;
    work_date: string;
    hours_worked: string;
    request_title: string;
  };
  // Thêm transaction_type cho tương thích ngược
  transaction_type?: string;
}

// Cập nhật response structure với nested data
interface TransactionHistoryResponse {
  success: boolean;
  data: {
    success: boolean;
    transactions: Transaction[];
    total: number;
    pagination: {
      current_page: number; // Thay đổi từ page thành current_page
      per_page: number;
      total_pages: number;
    };
    household_name?: string;
  };
}

const TransactionHistory = () => {
  const { householdId } = useParams<{ householdId: string }>();
  const [history, setHistory] = useState<TransactionHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [householdName, setHouseholdName] = useState<string>('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!householdId) return;
      
      try {
        setLoading(true);
        const response = await getExchangeTransactionHistory(
          parseInt(householdId),
          page,
          perPage
        ) as TransactionHistoryResponse;
        
        // Xử lý cấu trúc response mới
        if (response.success && response.data) {
          // Thêm transaction_type cho tương thích với UI hiện tại
          const processedTransactions = response.data.transactions.map(tx => {
            // Determine transaction_type based on available data
            let transaction_type = 'other';
            
            if (tx.labor_assignment_id) {
              transaction_type = 'completed_assignment';
            } else if (tx.description?.toLowerCase().includes('reset')) {
              transaction_type = 'reset';
            } else if (tx.description?.toLowerCase().includes('điều chỉnh') || 
                      tx.description?.toLowerCase().includes('adjustment')) {
              transaction_type = 'adjustment';
            }
            
            return {
              ...tx,
              transaction_type,
              // Keep hours as string to match Transaction type
            };
          });
          
          // Set data with the nested structure preserved
          setHistory({
            success: response.success,
            data: {
              success: response.data.success,
              transactions: processedTransactions,
              total: response.data.total,
              pagination: response.data.pagination,
              household_name: response.data.household_name
            }
          });
          
          // Set household name if available
          if (response.data.household_name) {
            setHouseholdName(response.data.household_name);
          }
        } else {
          throw new Error('Invalid response format');
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching transaction history:', err);
        setError('Không thể tải lịch sử giao dịch');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [householdId, page, perPage]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const getTransactionIcon = (transaction: Transaction) => {
    switch(transaction.transaction_type) {
      case 'completed_assignment':
        return (
          <div className="rounded-full bg-green-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'adjustment':
        return (
          <div className="rounded-full bg-blue-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
            </svg>
          </div>
        );
      case 'reset':
        return (
          <div className="rounded-full bg-red-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="rounded-full bg-gray-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Lịch sử giao dịch đổi công {householdName ? `với ${householdName}` : ''}
        </h1>
        <p className="text-gray-500">Xem chi tiết các giao dịch đổi công giữa hai hộ</p>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : history ? (
        <Card>
          <div className="p-4">
            {history.data.transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có giao dịch nào giữa hai hộ
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loại
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mô tả
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Giờ công
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.data.transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getTransactionIcon(transaction)}
                              <span className="ml-2 text-sm text-gray-900 capitalize">
                                {transaction.transaction_type === 'completed_assignment' 
                                  ? 'Công việc' 
                                  : transaction.transaction_type === 'adjustment' 
                                    ? 'Điều chỉnh' 
                                    : transaction.transaction_type === 'reset' 
                                      ? 'Reset số dư' 
                                      : transaction.transaction_type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.created_at)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {transaction.description || 
                              (transaction.assignment_details ? 
                                `Yêu cầu: ${transaction.assignment_details.request_title}` : 
                                `Công việc ngày ${formatDate(transaction.work_date || '')}`)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              parseFloat(transaction.hours) > 0 
                                ? 'bg-green-100 text-green-800' 
                                : parseFloat(transaction.hours) < 0 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {parseFloat(transaction.hours) > 0 ? `+${transaction.hours}` : transaction.hours} giờ
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {history && history.data.total > perPage && (
                  <div className="mt-4">
                    <Pagination
                      // Sử dụng current_page thay vì page nếu có
                      currentPage={history.data.pagination.current_page || page}
                      totalPages={history.data.pagination.total_pages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default TransactionHistory;