import { useState } from 'react';
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
import { mockVehicles } from '@/data/mockData';

const bloodTypeColors = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7'];

export default function Statistics() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const approvals = useApprovalStore((state) => state.approvals);
  const [dateRange, setDateRange] = useState('today');

  const vehicleStats = vehicles.map((v) => ({
    name: v.number,
    A: v.inventory.A,
    B: v.inventory.B,
    O: v.inventory.O,
    AB: v.inventory.AB,
    采集量: v.collectionRecords.length,
  }));

  const bloodTypeDistribution = [
    { name: 'A型', value: vehicles.reduce((sum, v) => sum + v.inventory.A, 0) },
    { name: 'B型', value: vehicles.reduce((sum, v) => sum + v.inventory.B, 0) },
    { name: 'O型', value: vehicles.reduce((sum, v) => sum + v.inventory.O, 0) },
    { name: 'AB型', value: vehicles.reduce((sum, v) => sum + v.inventory.AB, 0) },
  ];

  const dailyCollectionData = [
    { date: '1/10', 采集量: 45, 入库量: 42 },
    { date: '1/11', 采集量: 52, 入库量: 48 },
    { date: '1/12', 采集量: 38, 入库量: 35 },
    { date: '1/13', 采集量: 61, 入库量: 58 },
    { date: '1/14', 采集量: 49, 入库量: 46 },
    { date: '1/15', 采集量: 56, 入库量: 53 },
    { date: '1/16', 采集量: 44, 入库量: 0 },
  ];

  const totalCollection = vehicles.reduce(
    (sum, v) => sum + v.collectionRecords.length,
    0
  );
  const totalVolume = bloodTypeDistribution.reduce((sum, t) => sum + t.value, 0);
  const pendingApprovals = approvals.filter(
    (a) => a.stages.some((s) => s.status === 'processing')
  ).length;
  const passedRate = approvals.length > 0
    ? ((approvals.filter((a) => a.stages.every((s) => s.status === 'passed' || s.status === 'processing')).length / approvals.length) * 100).toFixed(1)
    : '0';

  const stats = [
    { label: '今日采集人次', value: totalCollection, icon: Droplets, color: 'from-blue-500 to-cyan-500', change: '+12%' },
    { label: '总库存量', value: totalVolume.toFixed(0) + ' 单位', icon: TrendingUp, color: 'from-green-500 to-emerald-500', change: '+5.2%' },
    { label: '待审批', value: pendingApprovals, icon: AlertTriangle, color: 'from-yellow-500 to-orange-500', change: '-3' },
    { label: '通过率', value: passedRate + '%', icon: BarChart3, color: 'from-purple-500 to-pink-500', change: '+2.1%' },
  ];

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    const summaryData = [
      ['采血日报表'],
      ['生成时间', new Date().toLocaleString('zh-CN')],
      [],
      ['统计项', '数值'],
      ['今日采集人次', totalCollection],
      ['总库存量', totalVolume.toFixed(0) + ' 单位'],
      ['待审批数', pendingApprovals],
      ['通过率', passedRate + '%'],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, '汇总');

    const vehicleHeaders = ['车辆编号', '状态', 'A型', 'B型', 'O型', 'AB型', '总库存', '采集记录数', '预约人数'];
    const vehicleData = vehicles.map((v) => [
      v.number,
      v.status === 'idle' ? '待命' : v.status === 'moving' ? '行驶中' : v.status === 'collecting' ? '采集中' : '维护中',
      v.inventory.A,
      v.inventory.B,
      v.inventory.O,
      v.inventory.AB,
      v.inventory.A + v.inventory.B + v.inventory.O + v.inventory.AB,
      v.collectionRecords.length,
      v.reservationCount,
    ]);
    const vehicleSheetData = [vehicleHeaders, ...vehicleData];
    const vehicleSheet = XLSX.utils.aoa_to_sheet(vehicleSheetData);
    XLSX.utils.book_append_sheet(workbook, vehicleSheet, '车辆库存');

    const recordHeaders = ['条码', '献血者', '血型', '采集量(ml)', '采集时间', '车辆'];
    const allRecords = vehicles.flatMap((v) =>
      v.collectionRecords.map((r) => [
        r.barcode,
        r.donorName,
        r.bloodType + '型',
        r.volume,
        r.collectionTime,
        v.number,
      ])
    );
    const recordSheetData = [recordHeaders, ...allRecords];
    const recordSheet = XLSX.utils.aoa_to_sheet(recordSheetData);
    XLSX.utils.book_append_sheet(workbook, recordSheet, '采集记录');

    XLSX.writeFile(workbook, `采血日报_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="text-purple-500" />
            统计报表
          </h1>
          <p className="text-slate-400">数据统计分析与报表导出</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === 'today' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              今日
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === 'week' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              本周
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === 'month' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              本月
            </button>
          </div>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors shadow-lg shadow-purple-500/20"
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
              className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                >
                  <IconComponent size={24} className="text-white" />
                </div>
                <span className="text-xs text-green-400 font-medium">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">各车采集量统计</h3>
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
          <h3 className="text-lg font-semibold text-white mb-4">血型分布</h3>
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
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5">
        <h3 className="text-lg font-semibold text-white mb-4">近7天采集趋势</h3>
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
