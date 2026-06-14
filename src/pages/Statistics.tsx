import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { BarChart3, Download, Calendar, TrendingUp, Droplets, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useVehicleStore } from '@/store/useVehicleStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useLogStore } from '@/store/useLogStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const bloodTypeColors = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7'];

type DateRange = 'today' | 'week' | 'month';

const dateRangeLabels: Record<DateRange, string> = {
  today: '今日',
  week: '本周',
  month: '本月',
};

export default function Statistics() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const approvals = useApprovalStore((state) => state.approvals);
  const { addLog } = useLogStore();
  const { currentUser } = useAuthStore();
  const [dateRange, setDateRange] = useState<DateRange>('today');

  const generateDailyCollectionData = (range: DateRange) => {
    const today = new Date();
    const days = range === 'today' ? 1 : range === 'week' ? 7 : 30;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = range === 'today' 
        ? `${date.getHours()}:00`
        : `${date.getMonth() + 1}/${date.getDate()}`;
      
      const baseMultiplier = range === 'today' ? 3 : range === 'week' ? 1 : 0.3;
      const randomFactor = 0.7 + Math.random() * 0.6;
      const collection = Math.floor((15 + Math.random() * 25) * baseMultiplier * randomFactor);
      const storage = Math.floor(collection * (0.9 + Math.random() * 0.08));
      
      data.push({
        date: dateStr,
        采集量: collection,
        入库量: storage,
      });
    }
    return data;
  };

  const dailyCollectionData = useMemo(() => {
    return generateDailyCollectionData(dateRange);
  }, [dateRange]);

  const rangeMultiplier = useMemo(() => {
    return dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : 30;
  }, [dateRange]);

  const vehicleStats = useMemo(() => {
    return vehicles.map((v) => ({
      name: v.number,
      A: Math.floor(v.inventory.A * (0.3 + rangeMultiplier * 0.1)),
      B: Math.floor(v.inventory.B * (0.3 + rangeMultiplier * 0.1)),
      O: Math.floor(v.inventory.O * (0.3 + rangeMultiplier * 0.1)),
      AB: Math.floor(v.inventory.AB * (0.3 + rangeMultiplier * 0.1)),
      采集量: Math.floor(v.collectionRecords.length * (0.3 + rangeMultiplier * 0.1)),
    }));
  }, [vehicles, rangeMultiplier]);

  const bloodTypeDistribution = useMemo(() => {
    return [
      { name: 'A型', value: vehicles.reduce((sum, v) => sum + v.inventory.A, 0) * (0.3 + rangeMultiplier * 0.1) },
      { name: 'B型', value: vehicles.reduce((sum, v) => sum + v.inventory.B, 0) * (0.3 + rangeMultiplier * 0.1) },
      { name: 'O型', value: vehicles.reduce((sum, v) => sum + v.inventory.O, 0) * (0.3 + rangeMultiplier * 0.1) },
      { name: 'AB型', value: vehicles.reduce((sum, v) => sum + v.inventory.AB, 0) * (0.3 + rangeMultiplier * 0.1) },
    ];
  }, [vehicles, rangeMultiplier]);

  const totalCollection = useMemo(() => {
    return dailyCollectionData.reduce((sum, d) => sum + d.采集量, 0);
  }, [dailyCollectionData]);

  const totalVolume = useMemo(() => {
    return bloodTypeDistribution.reduce((sum, t) => sum + t.value, 0);
  }, [bloodTypeDistribution]);

  const pendingApprovals = useMemo(() => {
    return approvals.filter(
      (a) => a.stages.some((s) => s.status === 'processing')
    ).length;
  }, [approvals]);

  const passedRate = useMemo(() => {
    if (approvals.length === 0) return '0';
    const passed = approvals.filter((a) => 
      a.stages.every((s) => s.status === 'passed' || s.status === 'processing')
    ).length;
    return ((passed / approvals.length) * 100).toFixed(1);
  }, [approvals]);

  const stats = [
    { label: `${dateRangeLabels[dateRange]}采集人次`, value: totalCollection, icon: Droplets, color: 'from-blue-500 to-cyan-500', change: '+12%' },
    { label: '总库存量', value: totalVolume.toFixed(0) + ' 单位', icon: TrendingUp, color: 'from-green-500 to-emerald-500', change: '+5.2%' },
    { label: '待审批', value: pendingApprovals, icon: AlertTriangle, color: 'from-yellow-500 to-orange-500', change: '-3' },
    { label: '通过率', value: passedRate + '%', icon: BarChart3, color: 'from-purple-500 to-pink-500', change: '+2.1%' },
  ];

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    const summaryData = [
      [`采血${dateRangeLabels[dateRange]}报表`],
      ['时间范围', dateRangeLabels[dateRange]],
      ['生成时间', new Date().toLocaleString('zh-CN')],
      [],
      ['统计项', '数值'],
      [`${dateRangeLabels[dateRange]}采集人次`, totalCollection],
      ['总库存量', totalVolume.toFixed(0) + ' 单位'],
      ['待审批数', pendingApprovals],
      ['通过率', passedRate + '%'],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, '汇总');

    const vehicleHeaders = ['车辆编号', '状态', 'A型', 'B型', 'O型', 'AB型', '总库存', '采集记录数', '预约人数'];
    const vehicleData = vehicleStats.map((v) => [
      v.name,
      '正常',
      v.A,
      v.B,
      v.O,
      v.AB,
      v.A + v.B + v.O + v.AB,
      v.采集量,
      Math.floor(v.采集量 * 0.3),
    ]);
    const vehicleSheetData = [vehicleHeaders, ...vehicleData];
    const vehicleSheet = XLSX.utils.aoa_to_sheet(vehicleSheetData);
    XLSX.utils.book_append_sheet(workbook, vehicleSheet, '车辆库存');

    const dailyHeaders = ['日期', '采集量', '入库量'];
    const dailySheetData = [dailyHeaders, ...dailyCollectionData.map(d => [d.date, d.采集量, d.入库量])];
    const dailySheet = XLSX.utils.aoa_to_sheet(dailySheetData);
    XLSX.utils.book_append_sheet(workbook, dailySheet, `${dateRangeLabels[dateRange]}趋势`);

    const bloodTypeHeaders = ['血型', '数量(单位)', '占比'];
    const totalBlood = bloodTypeDistribution.reduce((sum, t) => sum + t.value, 0);
    const bloodTypeSheetData = [
      bloodTypeHeaders,
      ...bloodTypeDistribution.map(t => [t.name, t.value.toFixed(0), ((t.value / totalBlood) * 100).toFixed(1) + '%'])
    ];
    const bloodTypeSheet = XLSX.utils.aoa_to_sheet(bloodTypeSheetData);
    XLSX.utils.book_append_sheet(workbook, bloodTypeSheet, '血型分布');

    if (currentUser) {
      addLog(
        currentUser.id,
        currentUser.name,
        `导出${dateRangeLabels[dateRange]}统计报表Excel`
      );
    }

    XLSX.writeFile(workbook, `采血${dateRangeLabels[dateRange]}报表_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    if (currentUser) {
      addLog(
        currentUser.id,
        currentUser.name,
        `切换统计报表时间范围为【${dateRangeLabels[range]}】`
      );
    }
  };

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="text-purple-500" />
            统计报表
          </h1>
          <p className="text-slate-400">数据统计分析与报表导出 · 当前查看：<span className="text-purple-400">{dateRangeLabels[dateRange]}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
            {(['today', 'week', 'month'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => handleDateRangeChange(range)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-all duration-200',
                  dateRange === range 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                )}
              >
                {dateRangeLabels[range]}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
          >
            <Download size={18} />
            导出Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                >
                  <IconComponent size={24} className="text-white" />
                </div>
                <span className="text-xs text-green-400 font-medium px-2 py-1 bg-green-500/10 rounded-full">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            各车采集量统计
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                />
                <Legend />
                <Bar dataKey="A" name="A型" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="B" name="B型" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="O" name="O型" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="AB" name="AB型" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            血型分布
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bloodTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {bloodTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={bloodTypeColors[index % bloodTypeColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                  formatter={(value: number) => [value.toFixed(0) + ' 单位', '数量']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
          {dateRangeLabels[dateRange]}采集趋势
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyCollectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: 'white',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="采集量"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="入库量"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
