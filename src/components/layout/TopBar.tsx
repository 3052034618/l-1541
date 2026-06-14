import { Bell, Clock, MapPin, Droplets } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useVehicleStore } from '@/store/useVehicleStore';

export function TopBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const vehicles = useVehicleStore((state) => state.vehicles);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeVehicles = vehicles.filter((v) => v.status !== 'maintenance').length;
  const collectingVehicles = vehicles.filter((v) => v.status === 'collecting').length;
  const totalInventory = vehicles.reduce(
    (sum, v) => sum + v.inventory.A + v.inventory.B + v.inventory.O + v.inventory.AB,
    0
  );

  return (
    <div className="h-14 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock size={16} />
          <span className="text-sm font-mono">
            {currentTime.toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          智慧城市流动献血车调度与血库联动可视化平台
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-400">运行车辆</span>
            <span className="text-sm font-bold text-white">{activeVehicles}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-slate-400">采集中</span>
            <span className="text-sm font-bold text-white">{collectingVehicles}</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets size={14} className="text-red-500" />
            <span className="text-xs text-slate-400">总库存</span>
            <span className="text-sm font-bold text-white">{totalInventory.toFixed(0)}</span>
          </div>
        </div>

        <button className="relative p-2 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-white">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </div>
  );
}
