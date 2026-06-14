import { useState, useMemo } from 'react';
import { CityScene } from '@/components/three/CityScene';
import { VehicleDetailPanel } from '@/components/panels/VehicleDetailPanel';
import { useVehicleStore } from '@/store/useVehicleStore';
import { mockStations } from '@/data/mockData';
import {
  Truck,
  MapPin,
  Droplets,
  AlertTriangle,
  Bell,
  X,
  TrendingUp,
  Navigation,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import type { BloodVehicle, BloodStation } from '@/types';
import { cn } from '@/lib/utils';

const SAFE_INVENTORY_THRESHOLD = {
  A: 3,
  B: 3,
  O: 5,
  AB: 1,
};

const calculateDistance = (p1: { x: number; y: number; z: number }, p2: { x: number; y: number; z: number }) => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.z - p2.z) ** 2);
};

export default function Dashboard() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'warning' | 'info' }>>([
    { id: 'welcome', message: '欢迎使用智慧献血车调度平台', type: 'info' },
  ]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const totalInventory = vehicles.reduce(
    (sum, v) => sum + v.inventory.A + v.inventory.B + v.inventory.O + v.inventory.AB,
    0
  );

  const activeVehicles = vehicles.filter((v) => v.status !== 'maintenance').length;
  const stationCount = mockStations.filter((s) => s.type === 'station').length;

  const lowInventoryAlerts: Array<{
    vehicleId: string;
    vehicleNumber: string;
    bloodType: string;
    current: number;
    safe: number;
    shortage: number;
  }> = useMemo(() => {
    const alerts: Array<{
      vehicleId: string;
      vehicleNumber: string;
      bloodType: string;
      current: number;
      safe: number;
      shortage: number;
    }> = [];

    for (const v of vehicles) {
      if (v.status === 'maintenance') continue;
      for (const type of ['A', 'B', 'O', 'AB'] as const) {
        const current = Math.floor(v.inventory[type]);
        const safe = SAFE_INVENTORY_THRESHOLD[type];
        if (current < safe) {
          alerts.push({
            vehicleId: v.id,
            vehicleNumber: v.number,
            bloodType: type,
            current,
            safe,
            shortage: safe - current,
          });
        }
      }
    }
    return alerts;
  }, [vehicles]);

  const lowInventoryVehicles = new Set(lowInventoryAlerts.map(a => a.vehicleId)).size;

  const dispatchSuggestions: Array<{
    vehicleId: string;
    vehicleNumber: string;
    target: BloodStation;
    distance: number;
    reason: string;
  }> = useMemo(() => {
    const suggestions: Array<{
      vehicleId: string;
      vehicleNumber: string;
      target: BloodStation;
      distance: number;
      reason: string;
    }> = [];

    const highTrafficStations = mockStations.filter(s => s.type === 'mall' || s.type === 'donation_point');

    for (const vehicle of vehicles) {
      if (vehicle.status === 'maintenance') continue;
      const total = vehicle.inventory.A + vehicle.inventory.B + vehicle.inventory.O + vehicle.inventory.AB;
      if (total >= 20) continue;

      let nearestStation: BloodStation | null = null;
      let minDistance = Infinity;
      for (const station of highTrafficStations) {
        const dist = calculateDistance(vehicle.position, station.position);
        if (dist < minDistance) {
          minDistance = dist;
          nearestStation = station;
        }
      }

      if (nearestStation && minDistance < 100) {
        const lowTypes = lowInventoryAlerts
          .filter(a => a.vehicleId === vehicle.id)
          .map(a => `${a.bloodType}型缺${a.shortage}`)
          .join('、');
        suggestions.push({
          vehicleId: vehicle.id,
          vehicleNumber: vehicle.number,
          target: nearestStation,
          distance: minDistance,
          reason: lowTypes ? `${lowTypes}，建议前往` : '库存偏低，建议补充采集',
        });
      }
    }

    return suggestions.sort((a, b) => a.distance - b.distance);
  }, [vehicles, lowInventoryAlerts]);

  const activeNotifications = useMemo(() => {
    const result: Array<{ id: string; message: string; type: 'warning' | 'info' }> = [];

    for (const alert of lowInventoryAlerts) {
      const id = `low_${alert.vehicleId}_${alert.bloodType}`;
      if (!dismissedIds.has(id)) {
        result.push({
          id,
          type: 'warning',
          message: `${alert.vehicleNumber} ${alert.bloodType}型库存不足（${alert.current}/${alert.safe}安全线）`,
        });
      }
    }

    for (const suggestion of dispatchSuggestions) {
      const id = `dispatch_${suggestion.vehicleId}`;
      if (!dismissedIds.has(id)) {
        result.push({
          id,
          type: 'info',
          message: `${suggestion.vehicleNumber} 建议调度至 ${suggestion.target.name}（距离 ${suggestion.distance.toFixed(0)}m）`,
        });
      }
    }

    return [...notifications.filter(n => !dismissedIds.has(n.id)), ...result];
  }, [lowInventoryAlerts, dispatchSuggestions, notifications, dismissedIds]);

  const dismissNotification = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const stats = [
    { label: '运行车辆', value: activeVehicles, icon: Truck, color: 'from-blue-500 to-cyan-500' },
    { label: '血站数量', value: stationCount, icon: MapPin, color: 'from-green-500 to-emerald-500' },
    { label: '总库存量', value: totalInventory.toFixed(0) + ' 单位', icon: Droplets, color: 'from-red-500 to-pink-500' },
    { label: '库存预警', value: lowInventoryVehicles, icon: AlertTriangle, color: 'from-yellow-500 to-orange-500' },
  ];

  const getBloodTypeColor = (type: string) => {
    switch (type) {
      case 'A': return 'bg-red-500 text-white';
      case 'B': return 'bg-blue-500 text-white';
      case 'O': return 'bg-green-500 text-white';
      case 'AB': return 'bg-purple-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getInventoryStatus = (vehicle: BloodVehicle) => {
    const lowTypes: string[] = [];
    for (const t of ['A', 'B', 'O', 'AB'] as const) {
      if (Math.floor(vehicle.inventory[t]) < SAFE_INVENTORY_THRESHOLD[t]) {
        lowTypes.push(t);
      }
    }
    return lowTypes;
  };

  return (
    <div className="relative w-full h-full bg-slate-950">
      <CityScene />
      <VehicleDetailPanel />

      <div className="absolute top-4 left-4 space-y-3 z-40">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          const isAlert = stat.label === '库存预警' && lowInventoryVehicles > 0;
          return (
            <div
              key={index}
              className={cn(
                'w-56 bg-slate-900/80 backdrop-blur-xl rounded-xl border p-4 shadow-lg transition-colors',
                isAlert
                  ? 'border-orange-500/50 ring-2 ring-orange-500/20 animate-pulse-slow'
                  : 'border-slate-700/50'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                >
                  <IconComponent size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute top-4 right-4 z-40 space-y-3 max-w-sm">
        {activeNotifications.length > 0 && (
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-yellow-400" />
                <span className="text-sm font-semibold text-white">实时预警</span>
                <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                  {activeNotifications.length}
                </span>
              </div>
              {activeNotifications.length > 1 && (
                <button
                  onClick={() => {
                    const ids = new Set(activeNotifications.map(n => n.id));
                    setDismissedIds(prev => new Set([...prev, ...ids]));
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  全部清除
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {activeNotifications.slice(0, 8).map(notice => (
                <div
                  key={notice.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 border-b border-slate-700/30 last:border-0 group',
                    notice.type === 'warning' ? 'bg-orange-500/5' : 'bg-blue-500/5'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                      notice.type === 'warning'
                        ? 'bg-orange-500/20'
                        : 'bg-blue-500/20'
                    )}
                  >
                    {notice.type === 'warning' ? (
                      <AlertTriangle size={14} className="text-orange-400" />
                    ) : (
                      <Navigation size={14} className="text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 leading-relaxed">{notice.message}</p>
                  </div>
                  <button
                    onClick={() => dismissNotification(notice.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-700/50 rounded"
                  >
                    <X size={12} className="text-slate-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {dispatchSuggestions.length > 0 && (
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-blue-500/30 p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-blue-400" />
              <span className="text-sm font-semibold text-white">调度建议</span>
            </div>
            <div className="space-y-2">
              {dispatchSuggestions.slice(0, 3).map(s => (
                <div
                  key={s.vehicleId}
                  className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{s.vehicleNumber}</span>
                    <span className="text-xs text-slate-400">{s.distance.toFixed(0)}m</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-300">
                    <MapPin size={12} />
                    <span className="truncate">{s.target.name}</span>
                    <ChevronRight size={12} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{s.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-green-400" />
            点位分布
          </h3>
          <div className="space-y-2">
            {['station', 'donation_point', 'emergency_center', 'mall'].map((type) => {
              const count = mockStations.filter((s) => s.type === type).length;
              const typeLabels: Record<string, string> = {
                station: '固定血站',
                donation_point: '社区献血点',
                emergency_center: '急救中心',
                mall: '商圈点位',
              };
              const typeColors: Record<string, string> = {
                station: 'bg-red-500',
                donation_point: 'bg-green-500',
                emergency_center: 'bg-yellow-500',
                mall: 'bg-purple-500',
              };
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${typeColors[type]}`} />
                    <span className="text-sm text-slate-300">{typeLabels[type]}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-40">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Truck size={16} className="text-blue-400" />
            献血车状态概览
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {vehicles.map((vehicle) => {
              const total = vehicle.inventory.A + vehicle.inventory.B + vehicle.inventory.O + vehicle.inventory.AB;
              const statusColors: Record<string, string> = {
                idle: 'bg-yellow-500',
                moving: 'bg-green-500',
                collecting: 'bg-blue-500',
                maintenance: 'bg-red-500',
              };
              const statusText: Record<string, string> = {
                idle: '待命',
                moving: '行驶中',
                collecting: '采集中',
                maintenance: '维护中',
              };
              const lowTypes = getInventoryStatus(vehicle);
              const suggestion = dispatchSuggestions.find(s => s.vehicleId === vehicle.id);

              return (
                <div
                  key={vehicle.id}
                  className={cn(
                    'bg-slate-800/50 rounded-lg p-3 border transition-all duration-300 hover:cursor-pointer',
                    lowTypes.length > 0
                      ? 'border-orange-500/40 ring-1 ring-orange-500/20 bg-orange-500/5'
                      : suggestion
                        ? 'border-blue-500/30 bg-blue-500/5'
                        : 'border-slate-700/30 hover:border-blue-500/50'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{vehicle.number}</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${statusColors[vehicle.status]}`} />
                      <span className="text-xs text-slate-400">{statusText[vehicle.status]}</span>
                    </div>
                  </div>

                  {lowTypes.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {lowTypes.map(t => (
                        <span
                          key={t}
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded font-medium',
                            getBloodTypeColor(t),
                            'opacity-80'
                          )}
                        >
                          {t}型低
                        </span>
                      ))}
                    </div>
                  )}

                  {suggestion && lowTypes.length === 0 && (
                    <div className="mb-2 flex items-center gap-1 text-xs text-blue-400">
                      <Navigation size={12} />
                      <span className="truncate">建议→{suggestion.target.name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">库存</span>
                    <span className={cn(
                      'font-medium',
                      total < 10 ? 'text-orange-400' : 'text-slate-300'
                    )}>
                      {total.toFixed(0)} 单位
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-500">预约</span>
                    <span className="text-slate-300">{vehicle.reservationCount} 人</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 mt-2 pt-2 border-t border-slate-700/30">
                    {(['A', 'B', 'O', 'AB'] as const).map(type => {
                      const count = Math.floor(vehicle.inventory[type]);
                      const isLow = count < SAFE_INVENTORY_THRESHOLD[type];
                      return (
                        <div key={type} className="text-center">
                          <div
                            className={cn(
                              'text-xs py-1 rounded',
                              isLow
                                ? 'bg-red-500/30 text-red-300 font-bold'
                                : 'text-slate-400'
                            )}
                          >
                            {count}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{type}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
