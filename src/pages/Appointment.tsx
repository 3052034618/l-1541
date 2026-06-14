import { useState, useEffect } from 'react';
import { Calendar, Plus, Check, X, Clock, User, Truck, MapPin } from 'lucide-react';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useLogStore } from '@/store/useLogStore';
import { useAuthStore } from '@/store/useAuthStore';
import { mockVehicles } from '@/data/mockData';
import type { AppointmentStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusOptions: { value: AppointmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  confirmed: { color: 'text-green-400', bg: 'bg-green-500/20' },
  completed: { color: 'text-blue-400', bg: 'bg-blue-500/20' },
  cancelled: { color: 'text-red-400', bg: 'bg-red-500/20' },
};

const statusText: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
};

export default function Appointment() {
  const { appointments, addAppointment, updateAppointmentStatus, findNearestVehicle } = useAppointmentStore();
  const { addLog } = useLogStore();
  const { currentUser } = useAuthStore();
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    donorName: '',
    bloodType: 'A',
    time: '',
  });
  const [nearestVehicle, setNearestVehicle] = useState<ReturnType<typeof findNearestVehicle>>(null);

  useEffect(() => {
    if (showAddModal) {
      const vehicle = findNearestVehicle();
      setNearestVehicle(vehicle);
    }
  }, [showAddModal, findNearestVehicle]);

  const filteredAppointments = appointments.filter((a) => {
    return filter === 'all' || a.status === filter;
  });

  const getVehicleName = (vehicleId: string) => {
    const vehicle = mockVehicles.find((v) => v.id === vehicleId);
    return vehicle?.number || '未知';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirm = (id: string) => {
    updateAppointmentStatus(id, 'confirmed');
    if (currentUser) {
      addLog(currentUser.id, currentUser.name, `确认了预约 ${id}`);
    }
  };

  const handleCancel = (id: string) => {
    updateAppointmentStatus(id, 'cancelled');
    if (currentUser) {
      addLog(currentUser.id, currentUser.name, `取消了预约 ${id}`);
    }
  };

  const handleSubmit = () => {
    if (!formData.donorName.trim()) {
      alert('请输入献血者姓名');
      return;
    }
    if (!formData.time) {
      alert('请选择预约时间');
      return;
    }
    if (!nearestVehicle) {
      alert('暂无可用车辆，请稍后再试');
      return;
    }

    const newAppointment = addAppointment({
      donorId: `donor_${Date.now()}`,
      donorName: formData.donorName.trim(),
      vehicleId: nearestVehicle.id,
      time: new Date(formData.time).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      bloodType: formData.bloodType,
    });

    if (currentUser) {
      addLog(currentUser.id, currentUser.name, `创建了预约 ${newAppointment.id}，分配至 ${nearestVehicle.number}`);
    }

    setFormData({ donorName: '', bloodType: 'A', time: '' });
    setShowAddModal(false);
  };

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Calendar className="text-green-500" />
            预约管理
          </h1>
          <p className="text-slate-400">管理献血预约，自动分配就近车次</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors shadow-lg shadow-green-500/20"
        >
          <Plus size={18} />
          新建预约
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-slate-800/50 rounded-lg p-1">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                filter === option.value
                  ? 'bg-green-600 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="text-sm text-slate-400">
          共 <span className="text-white font-medium">{filteredAppointments.length}</span> 条预约
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">预约编号</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">献血者</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">血型</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">分配车辆</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">预约时间</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">状态</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.map((appointment) => (
              <tr
                key={appointment.id}
                className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-white font-mono">{appointment.id}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {appointment.donorName.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm text-white">{appointment.donorName}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                    {appointment.bloodType}型
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Truck size={14} />
                    {getVehicleName(appointment.vehicleId)}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Clock size={14} />
                    {appointment.time}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium',
                      statusConfig[appointment.status].bg,
                      statusConfig[appointment.status].color
                    )}
                  >
                    {statusText[appointment.status]}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleConfirm(appointment.id)}
                          className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleCancel(appointment.id)}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(appointment.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        取消预约
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAppointments.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <Calendar size={48} className="mx-auto mb-3 opacity-50" />
            <p>暂无预约记录</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-700/50 w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">新建预约</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">献血者姓名</label>
                <input
                  type="text"
                  value={formData.donorName}
                  onChange={(e) => handleInputChange('donorName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">血型</label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => handleInputChange('bloodType', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                >
                  <option value="A">A型</option>
                  <option value="B">B型</option>
                  <option value="O">O型</option>
                  <option value="AB">AB型</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">预约时间</label>
                <input
                  type="datetime-local"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              {nearestVehicle && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                    <MapPin size={14} />
                    <span className="font-medium">已自动分配最近车辆</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-white" />
                      <span className="text-white">{nearestVehicle.number}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      护士: {nearestVehicle.nurseName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <User size={12} />
                    <span>当前预约: {nearestVehicle.reservationCount} 人</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ donorName: '', bloodType: 'A', time: '' });
                }}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors"
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
