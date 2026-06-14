import { CityScene } from '@/components/three/CityScene';
import { VehicleDetailPanel } from '@/components/panels/VehicleDetailPanel';
import { useVehicleStore } from '@/store/useVehicleStore';
import { mockStations } from '@/data/mockData';
import { Truck, MapPin, Droplets, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const vehicles = useVehicleStore((state) => state.vehicles);

  const totalInventory = vehicles.reduce(
    (sum, v) => sum + v.inventory.A + v.inventory.B + v.inventory.O + v.inventory.AB,
    0
  );

  const activeVehicles = vehicles.filter((v) => v.status !== 'maintenance').length;
  const stationCount = mockStations.filter((s) => s.type === 'station').length;
  const lowInventoryVehicles = vehicles.filter((v) => {
    const total = v.inventory.A + v.inventory.B + v.inventory.O + v.inventory.AB;
    return total < 30;
  }).length;

  const stats = [
    { label: '运行车辆', value: activeVehicles, icon: Truck, color: 'from-blue-500 to-cyan-500' },
    { label: '血站数量', value: stationCount, icon: MapPin, color: 'from-green-500 to-emerald-500' },
    { label: '总库存量', value: totalInventory.toFixed(0) + ' 单位', icon: Droplets, color: 'from-red-500 to-pink-500' },
    { label: '库存预警', value: lowInventoryVehicles, icon: AlertTriangle, color: 'from-yellow-500 to-orange-500' },
  ];

  return (
    <div className="relative w-full h-full bg-slate-950">
      <CityScene />

      <VehicleDetailPanel />

      <div className="absolute top-4 left-4 space-y-3 z-40">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="w-56 bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 shadow-lg"
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
              return (
                <div
                  key={vehicle.id}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 hover:border-blue-500/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{vehicle.number}</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${statusColors[vehicle.status]}`} />
                      <span className="text-xs text-slate-400">{statusText[vehicle.status]}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">库存</span>
                    <span className="text-slate-300 font-medium">{total.toFixed(0)} 单位</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-500">预约</span>
                    <span className="text-slate-300">{vehicle.reservationCount} 人</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 mt-20 z-40">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 w-72">
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
    </div>
  );
}
