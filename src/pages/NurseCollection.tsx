import { useState } from 'react';
import {
  QrCode,
  User,
  Truck,
  Droplets,
  Check,
  Calendar,
  Search,
  Scan,
  FileBarChart,
} from 'lucide-react';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useVehicleStore } from '@/store/useVehicleStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useLogStore } from '@/store/useLogStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import type { Appointment, BloodApproval, CollectionRecord } from '@/types';

const generateBarcode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BLD-${timestamp}-${random}`;
};

const stageLabels: Record<string, string> = {
  initial_screening: '初筛',
  recheck: '复检',
  storage: '入库',
};

export default function NurseCollection() {
  const { appointments, updateAppointmentStatus } = useAppointmentStore();
  const { vehicles, addCollectionRecord } = useVehicleStore();
  const { addApproval } = useApprovalStore();
  const { addLog } = useLogStore();
  const { currentUser } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [step, setStep] = useState<'select' | 'collect'>('select');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [bloodType, setBloodType] = useState('A');
  const [volume, setVolume] = useState('300');
  const [generatedBarcode, setGeneratedBarcode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const pendingAppointments = appointments.filter(
    a => a.status === 'pending' || a.status === 'confirmed'
  );

  const vehicleAppointments = selectedVehicleId
    ? pendingAppointments.filter(a => a.vehicleId === selectedVehicleId)
    : pendingAppointments;

  const filteredAppointments = vehicleAppointments.filter(a =>
    !searchTerm ||
    a.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone.includes(searchTerm) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.number || '未知';

  const handleStartCollect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setBloodType(appointment.bloodType || 'A');
    setVolume('300');
    setStep('collect');
  };

  const handleCompleteCollection = () => {
    if (!selectedAppointment) return;

    const barcode = generateBarcode();
    const volumeNum = parseInt(volume, 10) || 300;
    const now = new Date().toISOString();
    const bloodTypeRecord = bloodType as 'A' | 'B' | 'O' | 'AB';

    const record: CollectionRecord = {
      id: `rec_${Date.now()}`,
      donorId: selectedAppointment.donorId,
      barcode,
      donorName: selectedAppointment.donorName,
      bloodType: bloodTypeRecord,
      volume: volumeNum,
      collectionTime: now,
      vehicleId: selectedAppointment.vehicleId,
    };

    addCollectionRecord(selectedAppointment.vehicleId, record);

    const newApproval: BloodApproval = {
      id: `aprv_${Date.now()}`,
      barcode,
      donorName: selectedAppointment.donorName,
      bloodType,
      volume: volumeNum,
      currentStage: 'initial_screening',
      stages: [
        { name: '初筛', status: 'processing', operator: '', time: '', remark: '' },
        { name: '复检', status: 'pending', operator: '', time: '', remark: '' },
        { name: '入库', status: 'pending', operator: '', time: '', remark: '' },
      ],
      createTime: now,
      vehicleId: selectedAppointment.vehicleId,
      stored: false,
    };

    addApproval(newApproval);
    updateAppointmentStatus(selectedAppointment.id, 'completed');

    setGeneratedBarcode(barcode);
    setShowSuccess(true);

    if (currentUser) {
      addLog(
        currentUser.id,
        currentUser.name,
        `护士完成采血：献血者 ${selectedAppointment.donorName}，条码 ${barcode}，${bloodType}型 ${volumeNum}ml，车辆 ${getVehicleName(selectedAppointment.vehicleId)}`
      );
    }

    setTimeout(() => {
      setShowSuccess(false);
      setStep('select');
      setSelectedAppointment(null);
      setGeneratedBarcode('');
    }, 3000);
  };

  const nurseVehicles = vehicles.filter(v =>
    currentUser?.name ? v.nurseName.includes(currentUser.name) : true
  );

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <QrCode className="text-green-500" />
          护士采血工作台
        </h1>
        <p className="text-slate-400">
          选择已到场预约人员 → 录入采集信息 → 自动生成条码并同步至审批中心
        </p>
      </div>

      {showSuccess && (
        <div className="fixed top-24 right-6 z-50 bg-green-600/90 backdrop-blur-xl rounded-xl border border-green-400/50 p-6 shadow-2xl animate-bounce-in max-w-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-400/20 flex items-center justify-center">
              <Check size={28} className="text-green-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">采集完成！</h3>
              <p className="text-sm text-green-100 mb-2">条码已生成，记录已同步</p>
              <div className="bg-black/30 rounded-lg px-3 py-2 font-mono text-sm text-green-300">
                {generatedBarcode}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-slate-500" />
          <span className="text-sm text-slate-400">选择献血车：</span>
          <select
            value={selectedVehicleId}
            onChange={e => setSelectedVehicleId(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
          >
            <option value="">全部车辆</option>
            {nurseVehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.number} - {v.nurseName}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索姓名/手机号/预约号..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">待处理预约:</span>
          <span className="font-bold text-green-400">{filteredAppointments.length}</span>
        </div>
      </div>

      {step === 'select' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map(appt => (
              <div
                key={appt.id}
                className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5 hover:border-green-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <span className="text-white font-bold">
                        {appt.donorName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{appt.donorName}</h3>
                      <p className="text-xs text-slate-500">预约号: {appt.id}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                    {appt.bloodType}型
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Truck size={14} />
                    <span>{getVehicleName(appt.vehicleId)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={14} />
                    <span>{appt.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <User size={14} />
                    <span>{appt.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    appt.status === 'confirmed'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  )}>
                    {appt.status === 'confirmed' ? '已确认' : '待确认'}
                  </span>
                  <button
                    onClick={() => handleStartCollect(appt)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Scan size={14} />
                    开始采集
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center">
              <Calendar size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-slate-400 text-lg mb-2">暂无待处理预约</p>
              <p className="text-slate-500 text-sm">
                {searchTerm
                  ? '请尝试其他搜索关键词'
                  : '请先在预约管理中创建预约'}
              </p>
            </div>
          )}
        </div>
      ) : (
        selectedAppointment && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/30">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {selectedAppointment.donorName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedAppointment.donorName}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {getVehicleName(selectedAppointment.vehicleId)} · {selectedAppointment.time}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    手机号: {selectedAppointment.phone}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileBarChart size={18} className="text-green-500" />
                录入采集信息
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">血型</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['A', 'B', 'O', 'AB'].map(type => (
                      <button
                        key={type}
                        onClick={() => setBloodType(type)}
                        className={cn(
                          'py-2 rounded-lg font-bold transition-colors',
                          bloodType === type
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">采血量 (ml)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['200', '300', '400'].map(v => (
                      <button
                        key={v}
                        onClick={() => setVolume(v)}
                        className={cn(
                          'py-2 rounded-lg font-bold transition-colors',
                          volume === v
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-medium text-slate-400 mb-3">采集信息预览</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">献血者</span>
                    <span className="text-white">{selectedAppointment.donorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">血型</span>
                    <span className="text-green-400 font-bold">{bloodType}型</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">采血量</span>
                    <span className="text-blue-400 font-bold">{volume} ml</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">献血车</span>
                    <span className="text-white">
                      {getVehicleName(selectedAppointment.vehicleId)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('select');
                    setSelectedAppointment(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  返回选择
                </button>
                <button
                  onClick={handleCompleteCollection}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-lg shadow-green-500/20"
                >
                  <Check size={18} />
                  确认采集并生成条码
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
