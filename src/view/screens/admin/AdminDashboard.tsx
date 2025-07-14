import { Filter, LogOut, RefreshCw, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface KYCRecord {
  id: string;
  cpf: string;
  name: string;
  status: string;
  contactNumber: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cpfFilter, setCpfFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  // Busca os registros via endpoint de administração
  const fetchKYCRecords = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/kyc`);
      const data = await response.json();
      if (data.success) {
        const sortedRecords = data.data.sort(
          (a: KYCRecord, b: KYCRecord) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setKycRecords(sortedRecords);
      } else {
        console.error('❌ Erro ao carregar registros:', data.message);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYCRecords();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/admin/login');
  };

  // Aplica filtros por CPF e status
  const filteredRecords = kycRecords.filter((record) => {
    const matchCpf = cpfFilter ? record.cpf.includes(cpfFilter) : true;
    const matchStatus = statusFilter ? record.status === statusFilter : true;
    return matchCpf && matchStatus;
  });

  const handleRowClick = (id: string) => {
    navigate(`/admin/kyc/${id}`);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setActionLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/kyc/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const data = await response.json();
      if (data.success) {
        setKycRecords((prev) =>
          prev.map((record) =>
            record.id === id ? { ...record, status: newStatus } : record,
          ),
        );
      } else {
        console.error('❌ Erro ao atualizar status:', data.message);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFiles = async (id: string) => {
    if (
      !window.confirm(
        'Tem certeza que deseja deletar os arquivos deste registro?',
      )
    ) {
      return;
    }
    try {
      setActionLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/kyc/${id}/files`,
        {
          method: 'DELETE',
        },
      );
      const data = await response.json();
      if (data.success) {
        alert('Arquivos deletados com sucesso!');
        // Opcional: atualizar a lista após exclusão, se o registro também for removido, chamar fetchKYCRecords()
        fetchKYCRecords();
      } else {
        alert('Erro ao deletar arquivos: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar arquivos:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Dashboard Administrativo - KYC
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                disabled={actionLoading}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Filtrar por CPF"
                  value={cpfFilter}
                  onChange={(e) => setCpfFilter(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="flex-1 min-w-[200px] relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Todos os status</option>
                  <option value="PENDING_REVIEW">Pendente</option>
                  <option value="APPROVED">Aprovado</option>
                  <option value="REJECTED">Rejeitado</option>
                </select>
              </div>
              <button
                onClick={fetchKYCRecords}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={loading || actionLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CPF
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data de Submissão
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        onClick={() => handleRowClick(record.id)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.cpf}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.contactNumber || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : record.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {record.status === 'PENDING_REVIEW'
                              ? 'Pendente'
                              : record.status === 'APPROVED'
                                ? 'Aprovado'
                                : 'Rejeitado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newStatus =
                                record.status === 'APPROVED'
                                  ? 'REJECTED'
                                  : 'APPROVED';
                              handleStatusUpdate(record.id, newStatus);
                            }}
                            className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                              record.status === 'APPROVED'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            disabled={actionLoading}
                          >
                            {record.status === 'APPROVED'
                              ? 'Rejeitar'
                              : 'Aprovar'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFiles(record.id);
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                            disabled={actionLoading}
                          >
                            Deletar Arquivos
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
