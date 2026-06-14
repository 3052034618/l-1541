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
import { BarChart3, Download, TrendingUp, Droplets, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useVehicleStore } from '@/store/useVehicleStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useLogStore } from '@/store/useLogStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import type { CollectionRecord } from '@/types';

const bloodTypeColors = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7'];

type DateRange = 'today' | 'week' | 'month';

const dateRangeLabels: Record<DateRange, string> = {
  today: '今日',
  week: '本周',
  month: '本月',
};

const stageLabels: Record<string, string> = {
  initial_screening: '初筛',
  recheck: '复检',
  storage: '入库',
};

const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  passed: '已通过',
  failed: '未通过',
};

function getDateRange(range: DateRange): { start: Date; end: Date; days: number } {
  const end = new Date();
  const start = new Date();
  
  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
    return { start, end, days: 1 };
  }
  
  if (range === 'week') {
    const day = end.getDay();
    const diff = end.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return { start, end, days: 7 };
  }
  
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return { start, end, days: new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate() };
}

function isInRange(time: string, start: Date, end: Date): boolean {
  const t = new Date(time);
  return t >= start && t <= end;
}

function formatDateLabel(date: Date, days: number): string {
  if (days === 1) {
    return `${date.getHours()}:00`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function Statistics() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const approvals = useApprovalStore((state) => state.approvals);
  const { addLog } = useLogStore();
  const { currentUser } = useAuthStore();
  const [dateRange, setDateRange] = useState<DateRange>('today');

  const { start, end, days } = useMemo(() => getDateRange(dateRange), [dateRange]);

  const allCollectionRecords = useMemo(() => {
    const records: (CollectionRecord & { vehicleId: string; vehicleNumber: string })[] = [];
    for (const v of vehicles) {
      for (const r of v.collectionRecords) {
        records.push({ ...r, vehicleId: v.id, vehicleNumber: v.number });
      }
    }
    return records;
  }, [vehicles]);

  const rangeRecords = useMemo(() => {
    return allCollectionRecords.filter(r => isInRange(r.collectionTime, start, end));
  }, [allCollectionRecords, start, end]);

  const rangeApprovals = useMemo(() => {
    return approvals.filter(a => isInRange(a.createTime, start, end));
  }, [approvals, start, end]);

  const totalCollection = rangeRecords.length;

  const totalStorageVolume = useMemo(() => {
    const stored = rangeApprovals.filter(a => a.stored || (a.currentStage === 'storage' && a.stages[2]?.status === 'passed'));
    return stored.reduce((sum, a) => sum + a.volume, 0) / 100;
  }, [rangeApprovals]);

  const bloodTypeDistribution = useMemo(() => {
    const dist = { A: 0, B: 0, O: 0, AB: 0 };
    for (const r of rangeRecords) {
      dist[r.bloodType as keyof typeof dist] += r.volume / 100;
    }
    return [
      { name: 'A型', value: dist.A },
      { name: 'B型', value: dist.B },
      { name: 'O型', value: dist.O },
      { name: 'AB型', value: dist.AB },
    ];
  }, [rangeRecords]);

  const totalVolume = bloodTypeDistribution.reduce((sum, t) => sum + t.value, 0);

  const vehicleStats = useMemo(() => {
    return vehicles.map(v => {
      const vRecords = rangeRecords.filter(r => r.vehicleId === v.id);
      const bloodCounts = { A: 0, B: 0, O: 0, AB: 0 };
      for (const r of vRecords) {
        bloodCounts[r.bloodType as keyof typeof bloodCounts] += r.volume / 100;
      }
      return {
        name: v.number,
        A: Math.floor(bloodCounts.A),
        B: Math.floor(bloodCounts.B),
        O: Math.floor(bloodCounts.O),
        AB: Math.floor(bloodCounts.AB),
        采集量: vRecords.length,
      };
    });
  }, [vehicles, rangeRecords]);

  const dailyData = useMemo(() => {
    const dataMap: { date: string; 采集量: number; 入库量: number }[] = [];
    const buckets = new Map<string, { collection: number; storage: number }>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      buckets.set(key, { collection: 0, storage: 0 });
    }

    for (const r of rangeRecords) {
      const d = new Date(r.collectionTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const entry = buckets.get(key);
      if (entry) {
        entry.collection++;
      }
    }

    for (const a of rangeApprovals) {
      if (a.stored || (a.currentStage === 'storage' && a.stages[2]?.status === 'passed')) {
        const d = new Date(a.createTime);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const entry = buckets.get(key);
        if (entry) {
          entry.storage++;
        }
      }
    }

    let idx = days - 1;
    for (const value of buckets.values()) {
      const d = new Date(end);
      d.setDate(d.getDate() - idx);
      dataMap.push({
        date: formatDateLabel(d, days),
        采集量: value.collection,
        入库量: value.storage,
      });
      idx--;
    }

    return dataMap;
  }, [days, end, rangeRecords, rangeApprovals]);

  const pendingApprovals = useMemo(() => {
    const stageOrder = ['initial_screening', 'recheck', 'storage'];
    return rangeApprovals.filter(a => {
      const idx = stageOrder.indexOf(a.currentStage);
      return a.stages[idx]?.status === 'processing';
    }).length;
  }, [rangeApprovals]);

  const passedRate = useMemo(() => {
    if (rangeApprovals.length === 0) return '0.0';
    const passed = rangeApprovals.filter(a =>
      a.stages.every(s => s.status === 'passed' || s.status === 'processing')
    ).length;
    return ((passed / rangeApprovals.length) * 100).toFixed(1);
  }, [rangeApprovals]);

  const storedCount = useMemo(
    () => rangeApprovals.filter(a => a.stored || (a.currentStage === 'storage' && a.stages[2]?.status === 'passed')).length,
    [rangeApprovals]
  );

  const unStoredCount = rangeApprovals.length - storedCount;

  const stats = [
    { label: `${dateRangeLabels[dateRange]}采集人次`, value: totalCollection, icon: Droplets, color: 'from-blue-500 to-cyan-500', change: '+12%' },
    { label: '已入库量', value: totalStorageVolume.toFixed(0) + ' 单位', icon: CheckCircle, color: 'from-green-500 to-emerald-500', change: '+5.2%' },
    { label: '待审批', value: pendingApprovals, icon: AlertTriangle, color: 'from-yellow-500 to-orange-500', change: '-3' },
    { label: '通过率', value: passedRate + '%', icon: TrendingUp, color: 'from-purple-500 to-pink-500', change: '+2.1%' },
  ];

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    const summaryData = [
      [`采血${dateRangeLabels[dateRange]}报表`],
      ['时间范围', dateRangeLabels[dateRange]],
      ['统计时段', `${start.toLocaleString('zh-CN')} 至 ${end.toLocaleString('zh-CN')}`],
      ['生成时间', new Date().toLocaleString('zh-CN')],
      [],
      ['统计项', '数值'],
      [`${dateRangeLabels[dateRange]}采集人次`, totalCollection],
      ['已入库量', totalStorageVolume.toFixed(0) + ' 单位'],
      ['采集总库存量(单位)', totalVolume.toFixed(0)],
      ['待审批数', pendingApprovals],
      ['审批通过率', passedRate + '%'],
      ['已入库记录数', storedCount],
      ['未入库记录数', unStoredCount],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, '汇总');

    const vehicleHeaders = ['车辆编号', 'A型(单位)', 'B型(单位)', 'O型(单位)', 'AB型(单位)', '总库存(单位)', '采集记录数'];
    const vehicleData = vehicleStats.map(v => [
      v.name, v.A, v.B, v.O, v.AB, v.A + v.B + v.O + v.AB, v.采集量]);
    const vehicleSheetData = [vehicleHeaders, ...vehicleData];
    const vehicleSheet = XLSX.utils.aoa_to_sheet(vehicleSheetData);
    XLSX.utils.book_append_sheet(workbook, vehicleSheet, '各车统计');

    const dailyHeaders = ['日期', '采集量(人次)', '入库量(人次)'];
    const dailySheetData = [dailyHeaders, ...dailyData.map(d => [d.date, d.采集量, d.入库量])];
    const dailySheet = XLSX.utils.aoa_to_sheet(dailySheetData);
    XLSX.utils.book_append_sheet(workbook, dailySheet, `${dateRangeLabels[dateRange]}趋势`);

    const bloodTypeHeaders = ['血型', '数量(单位)', '占比'];
    const totalBlood = bloodTypeDistribution.reduce((sum, t) => sum + t.value, 0);
    const bloodTypeSheetData = [
      bloodTypeHeaders,
      ...bloodTypeDistribution.map(t => [t.name, t.value.toFixed(0), totalBlood > 0 ? ((t.value / totalBlood) * 100).toFixed(1) + '%' : '0%'])
    ];
    const bloodTypeSheet = XLSX.utils.aoa_to_sheet(bloodTypeSheetData);
    XLSX.utils.book_append_sheet(workbook, bloodTypeSheet, '血型分布');

    if (rangeRecords.length > 0) {
      const recordHeaders = ['条码', '献血者', '血型', '采集量(ml)', '采集时间', '车辆'];
      const recordSheetData = [
        recordHeaders,
        ...rangeRecords.map(r => [r.barcode, r.donorName, r.bloodType + '型', r.volume, r.collectionTime, r.vehicleNumber])
      ];
      const recordSheet = XLSX.utils.aoa_to_sheet(recordSheetData);
      XLSX.utils.book_append_sheet(workbook, recordSheet, '采集记录明细');
    }

    if (rangeApprovals.length > 0) {
      const approvalHeaders = ['条码', '献血者', '血型', '采集量(ml)', '当前阶段', '状态', '是否入库', '驳回原因', '创建时间'];
      const approvalSheetData = [
        approvalHeaders,
        ...rangeApprovals.map(a => {
          const stageOrder = ['initial_screening', 'recheck', 'storage'];
          const idx = stageOrder.indexOf(a.currentStage);
          const status = a.stages[idx]?.status || 'pending';
          const isStored = a.stored || (a.currentStage === 'storage' && a.stages[2]?.status === 'passed') ? '是' : '否';
          return [
            a.barcode,
            a.donorName,
            a.bloodType + '型',
            a.volume,
            stageLabels[a.currentStage] || a.currentStage,
            statusLabels[status] || status,
            isStored,
            a.rejectReason || '',
            a.createTime,
          ];
        })
      ];
      const approvalSheet = XLSX.utils.aoa_to_sheet(approvalSheetData);
      XLSX.utils.book_append_sheet(workbook, approvalSheet, '审批记录');
    }

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
          <p className="text-slate-400">
            数据统计分析与报表导出 · 当前查看：<span className="text-purple-400">{dateRangeLabels[dateRange]}</span>
            <span className="ml-2 text-slate-500">
              ({start.toLocaleDateString('zh-CN')} ~ {end.toLocaleDateString('zh-CN')})
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
            {(['today', 'week', 'month'] as DateRange[]).map(range => (
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

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 flex items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{storedCount}</p>
              <p className="text-xs text-slate-400">已入库</p>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-700" />
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <XCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{unStoredCount}</p>
              <p className="text-xs text-slate-400">未入库</p>
            </div>
          </div>
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
                <span className="text-xs text-green-400 font-medium px-2 py-1 bg-green-500/10 rounded-full">
                  {stat.change}
                </span>
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
            <LineChart data={dailyData}>
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
