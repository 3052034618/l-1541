import { useState } from 'react';
import { Truck, Search, Filter, Eye, Settings, AlertCircle } from 'lucide-react';
import { useVehicleStore } from '@/store/useVehicleStore';
import type { VehicleStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusOptions: { value: VehicleStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'idle', label: '待命' },
  { value: 'moving', label: '行驶中' },
  { value: 'collecting', label: '采集中' },
  { value: 'maintenance', label: '维护中' },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  idle: { color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  moving: { color: 'text-green-400', bg: 'bg-green-500/20' },
  collecting: { color: 'text-blue-400', bg: 'bg-blue-500/20' },
  maintenance: { color: 'text-red-400', bg: 'bg-red-500/20' },
};

const statusText: Record<string, string> = {
  idle: '待命',
  moving: '行驶中',
  collecting: '采集中',
  maintenance: '维护中',
};

export default function Vehicles() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const selectVehicle = useVehicleStore((state) => state.selectVehicle);
  const selectedVehicleId = useVehicleStore((state) => state.selectedVehicleId);
  const [filter, setFilter] = useState<VehicleStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = vehicles.filter((v) => {
    const matchesFilter = filter === 'all' || v.status === filter;
    const matchesSearch = v.number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleViewVehicle = (id: string) => {
    selectVehicle(id);
  };

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <Truck className="text-blue-500" />
          献血车管理
        </h1>
        <p className="text-slate-400">管理所有流动献血车，查看车辆状态、库存和设备信息</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="搜索车辆编号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <div className="flex bg-slate-800/50 rounded-lg p-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    filter === option.value
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          共 <span className="text-white font-medium">{filteredVehicles.length}</span> 辆车
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle) => {
          const totalInventory =
            vehicle.inventory.A + vehicle.inventory.B + vehicle.inventory.O + vehicle.inventory.AB;
          const hasErrorDevice = vehicle.devices.some((d) => d.status === 'error');

          return (
            <div
              key={vehicle.id}
              className={cn(
                'bg-slate-900/50 backdrop-blur-xl rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10',
                selectedVehicleId === vehicle.id
                  ? 'border-blue-500 ring-2 ring-blue-500/30'
                  : 'border-slate-700/50 hover:border-slate-600'
              )}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{vehicle.number}</h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          statusConfig[vehicle.status].bg,
                          statusConfig[vehicle.status].color
                        )}
                      >
                        {statusText[vehicle.status]}
                      </span>
                      {hasErrorDevice && (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle size={12} />
                          设备故障
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Truck size={24} className="text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {['A', 'B', 'O', 'AB'].map((type) => {
                    const count = vehicle.inventory[type as keyof typeof vehicle.inventory];
                    const colors: Record<string, string> = {
                      A: 'bg-red-500',
                      B: 'bg-blue-500',
                      O: 'bg-green-500',
                      AB: 'bg-purple-500',
                    };
                    return (
                      <div key={type} className="text-center">
                        <div
                          className={`h-10 rounded-lg ${colors[type]} bg-opacity-20 flex items-center justify-center mb-1`}
                        >
                          <span className="text-sm font-bold text-white">{count}</span>
                        </div>
                        <span className="text-xs text-slate-500">{type}型</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-sm mb-4 text-slate-400">
                  <span>预约人数: {vehicle.reservationCount}</span>
                  <span>总库存: {totalInventory.toFixed(0)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                  <span>司机: {vehicle.driverName}</span>
                  <span className="text-slate-600">|</span>
                  <span>护士: {vehicle.nurseName}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewVehicle(vehicle.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Eye size={14} />
                    查看详情
                  </button>
                  <button className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                    <Settings size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
