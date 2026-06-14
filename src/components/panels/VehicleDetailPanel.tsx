import { X, Activity, Thermometer, Zap, Calendar, User, Droplets } from 'lucide-react';
import { useVehicleStore } from '@/store/useVehicleStore';
import { cn } from '@/lib/utils';
import type { DeviceStatus } from '@/types';

const statusText: Record<string, string> = {
  idle: '待命',
  moving: '行驶中',
  collecting: '采集中',
  maintenance: '维护中',
};

const statusColor: Record<string, string> = {
  idle: 'bg-yellow-500',
  moving: 'bg-green-500',
  collecting: 'bg-blue-500',
  maintenance: 'bg-red-500',
};

const deviceStatusColor: Record<DeviceStatus, string> = {
  normal: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

const deviceTypeIcon: Record<string, typeof Activity> = {
  collection: Activity,
  refrigeration: Thermometer,
  power: Zap,
};

const deviceTypeText: Record<string, string> = {
  collection: '采血设备',
  refrigeration: '冷藏设备',
  power: '电源设备',
};

export function VehicleDetailPanel() {
  const selectedVehicle = useVehicleStore((state) => state.getSelectedVehicle());
  const selectVehicle = useVehicleStore((state) => state.selectVehicle);

  if (!selectedVehicle) return null;

  const totalInventory =
    selectedVehicle.inventory.A +
    selectedVehicle.inventory.B +
    selectedVehicle.inventory.O +
    selectedVehicle.inventory.AB;

  const bloodTypes = [
    { type: 'A', count: selectedVehicle.inventory.A, color: 'bg-red-500' },
    { type: 'B', count: selectedVehicle.inventory.B, color: 'bg-blue-500' },
    { type: 'O', count: selectedVehicle.inventory.O, color: 'bg-green-500' },
    { type: 'AB', count: selectedVehicle.inventory.AB, color: 'bg-purple-500' },
  ];

  return (
    <div className="absolute top-4 right-4 w-96 bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-cyan-600/20">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusColor[selectedVehicle.status]} animate-pulse`} />
          <div>
            <h3 className="text-lg font-bold text-white">{selectedVehicle.number}</h3>
            <p className="text-xs text-slate-400">{statusText[selectedVehicle.status]}</p>
          </div>
        </div>
        <button
          onClick={() => selectVehicle(null)}
          className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <User size={14} />
            <span>司机: {selectedVehicle.driverName}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <User size={14} />
            <span>护士: {selectedVehicle.nurseName}</span>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Droplets size={14} className="text-cyan-400" />
              库存概览
            </h4>
            <span className="text-xs text-slate-400">总计 {totalInventory} 单位</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {bloodTypes.map((bt) => (
              <div key={bt.type} className="text-center">
                <div className={`h-16 rounded-lg ${bt.color} bg-opacity-20 flex items-center justify-center mb-1`}>
                  <span className="text-lg font-bold text-white">{bt.count}</span>
                </div>
                <span className="text-xs text-slate-400">{bt.type}型</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Activity size={14} className="text-green-400" />
            设备状态
          </h4>
          <div className="space-y-2">
            {selectedVehicle.devices.map((device) => {
              const IconComponent = deviceTypeIcon[device.type] || Activity;
              return (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30"
                >
                  <div className="flex items-center gap-2">
                    <IconComponent size={14} className={deviceStatusColor[device.status]} />
                    <span className="text-sm text-slate-300">{device.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${deviceStatusColor[device.status]}`}>
                      {device.status === 'normal' && '正常'}
                      {device.status === 'warning' && '警告'}
                      {device.status === 'error' && '故障'}
                    </span>
                    <div className={cn('w-2 h-2 rounded-full', {
                      'bg-green-500': device.status === 'normal',
                      'bg-yellow-500': device.status === 'warning',
                      'bg-red-500 animate-pulse': device.status === 'error',
                    })} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-yellow-400" />
            近24小时采集记录
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedVehicle.collectionRecords.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">暂无采集记录</p>
            ) : (
              selectedVehicle.collectionRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30"
                >
                  <div>
                    <p className="text-sm text-white">{record.donorName}</p>
                    <p className="text-xs text-slate-500">{record.collectionTime}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                      {record.bloodType}型
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{record.volume}ml</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
