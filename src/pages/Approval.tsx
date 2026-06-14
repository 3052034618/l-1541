import { useState, useMemo } from 'react';
import { FileCheck, Clock, User, Check, X, Search, Filter, AlertOctagon, Warehouse, AlertCircle } from 'lucide-react';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useLogStore } from '@/store/useLogStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useVehicleStore } from '@/store/useVehicleStore';
import type { ApprovalStage, ApprovalStatus, BloodApproval } from '@/types';
import { cn } from '@/lib/utils';

const stageOrder: ApprovalStage[] = ['initial_screening', 'recheck', 'storage'];
const stageLabels: Record<ApprovalStage, string> = {
  initial_screening: '初筛',
  recheck: '复检',
  storage: '入库',
};

const statusColors: Record<ApprovalStatus, string> = {
  pending: 'bg-slate-600',
  processing: 'bg-blue-500',
  passed: 'bg-green-500',
  failed: 'bg-red-500',
};

const statusText: Record<ApprovalStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  passed: '已通过',
  failed: '未通过',
};

const commonRejectReasons = [
  '乙肝表面抗原阳性',
  '丙肝抗体阳性',
  '转氨酶偏高',
  '血红蛋白不足',
  '血压异常',
  '其他原因',
];

export default function Approval() {
  const approvals = useApprovalStore((state) => state.approvals);
  const updateApprovalStage = useApprovalStore((state) => state.updateApprovalStage);
  const { addLog } = useLogStore();
  const { currentUser } = useAuthStore();
  const { vehicles } = useVehicleStore();
  const [filter, setFilter] = useState<ApprovalStage | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingRejectData, setPendingRejectData] = useState<{ id: string; stage: ApprovalStage } | null>(null);

  const filteredApprovals = useMemo(() => {
    return approvals.filter((a) => {
      const matchesFilter = filter === 'all' || a.currentStage === filter;
      const matchesSearch = searchTerm.trim() === ''
        ? true
        : a.barcode.toLowerCase().includes(searchTerm.toLowerCase())
          || a.donorName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [approvals, filter, searchTerm]);

  const storedCount = approvals.filter(a => a.stored).length;
  const rejectedCount = approvals.filter(a => a.stages.some(s => s.status === 'failed')).length;
  const pendingCount = approvals.filter(a => {
    const idx = stageOrder.indexOf(a.currentStage);
    return a.stages[idx]?.status === 'processing';
  }).length;

  const getVehicleName = (vehicleId: string) => vehicles.find(v => v.id === vehicleId)?.number || '未知';

  const handleApprove = (approval: BloodApproval) => {
    const isLastStage = approval.currentStage === 'storage';
    updateApprovalStage(
      approval.id,
      approval.currentStage,
      'passed',
      currentUser?.name || '张主任',
      remark || `${stageLabels[approval.currentStage]}通过`
    );
    if (currentUser) {
      const extraMsg = isLastStage ? '，血液已入库' : '';
      addLog(
        currentUser.id,
        currentUser.name,
        `${stageLabels[approval.currentStage]}审批通过：血液条码 ${approval.barcode}，献血者 ${approval.donorName}${extraMsg}`
      );
    }
    setSelectedApproval(null);
    setRemark('');
  };

  const openRejectModal = (id: string, stage: ApprovalStage) => {
    setPendingRejectData({ id, stage });
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!pendingRejectData) return;
    const { id, stage } = pendingRejectData;
    const approval = approvals.find(a => a.id === id);
    
    updateApprovalStage(
      id,
      stage,
      'failed',
      currentUser?.name || '张主任',
      remark || '审批未通过',
      rejectReason
    );
    
    if (currentUser && approval) {
      addLog(
        currentUser.id,
        currentUser.name,
        `${stageLabels[stage]}审批驳回：血液条码 ${approval.barcode}，献血者 ${approval.donorName}，原因：${rejectReason || remark || '未填写'}`
      );
    }
    
    setSelectedApproval(null);
    setRemark('');
    setRejectReason('');
    setShowRejectModal(false);
    setPendingRejectData(null);
  };

  const getCurrentStageIndex = (stage: ApprovalStage) => stageOrder.indexOf(stage);

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <FileCheck className="text-yellow-500" />
          审批中心
        </h1>
        <p className="text-slate-400">初筛-复检-入库三级审批流程管理 · 入库通过后自动更新车辆库存</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-400">待审批</h3>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Clock size={20} className="text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{pendingCount}</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-400">已入库</h3>
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Warehouse size={20} className="text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{storedCount}</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-400">已驳回</h3>
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertOctagon size={20} className="text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{rejectedCount}</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-400">总记录</h3>
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <FileCheck size={20} className="text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{approvals.length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="搜索条码/姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500 w-64 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <div className="flex bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  filter === 'all' ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                全部
              </button>
              {stageOrder.map((stage) => (
                <button
                  key={stage}
                  onClick={() => setFilter(stage)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    filter === stage ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-white'
                  )}
                >
                  {stageLabels[stage]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          {searchTerm ? (
            <span>
              搜索 "<span className="text-yellow-400">{searchTerm}</span>"，
              共 <span className="text-white font-medium">{filteredApprovals.length}</span> 条结果
            </span>
          ) : (
            <span>
              共 <span className="text-white font-medium">{filteredApprovals.length}</span> 条记录
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredApprovals.length > 0 ? (
          filteredApprovals.map((approval) => {
            const currentStageIdx = getCurrentStageIndex(approval.currentStage);
            const isProcessing = approval.stages[currentStageIdx]?.status === 'processing';
            const isFailed = approval.stages.some(s => s.status === 'failed');
            const failedStage = approval.stages.find(s => s.status === 'failed');

            return (
              <div
                key={approval.id}
                className={cn(
                  'bg-slate-900/50 backdrop-blur-xl rounded-xl border overflow-hidden transition-all duration-300',
                  selectedApproval === approval.id
                    ? 'border-yellow-500 ring-2 ring-yellow-500/20'
                    : isFailed
                      ? 'border-red-500/40 hover:border-red-400/50'
                      : approval.stored
                        ? 'border-green-500/40 hover:border-green-400/50'
                        : 'border-slate-700/50 hover:border-slate-600'
                )}
                onClick={() => setSelectedApproval(approval.id)}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <span className="text-white font-bold">{approval.donorName.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{approval.donorName}</h3>
                        <p className="text-sm text-slate-400 font-mono">{approval.barcode}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {approval.stored && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                            <Warehouse size={12} />
                            已入库
                          </span>
                        )}
                        {isFailed && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                            <AlertOctagon size={12} />
                            已驳回
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">
                        {approval.bloodType}型 / {approval.volume}ml
                      </span>
                      <span className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs">
                        {getVehicleName(approval.vehicleId)}
                      </span>
                      <span className="text-sm text-slate-400">{approval.createTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {approval.stages.map((stage, idx) => (
                      <div key={idx} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
                              statusColors[stage.status]
                            )}
                          >
                            {stage.status === 'passed' && <Check size={18} />}
                            {stage.status === 'failed' && <X size={18} />}
                            {stage.status === 'processing' && <Clock size={18} />}
                            {stage.status === 'pending' && <span>{idx + 1}</span>}
                          </div>
                          <span className="text-xs text-slate-400 mt-2">{stage.name}</span>
                          <span className="text-xs text-slate-500 mt-1">
                            {statusText[stage.status]}
                          </span>
                        </div>
                        {idx < approval.stages.length - 1 && (
                          <div className="flex-1 h-0.5 mx-2 -mt-4">
                            <div
                              className={cn(
                                'h-full',
                                idx < currentStageIdx && !isFailed ? 'bg-green-500' : isFailed && idx < approval.stages.findIndex(s => s.status === 'failed') ? 'bg-red-500' : 'bg-slate-700'
                              )}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedApproval === approval.id && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {approval.stages.map((stage, idx) => (
                          <div key={idx} className="bg-slate-800/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">{stage.name}</span>
                              <span
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded-full',
                                  statusColors[stage.status],
                                  'text-white'
                                )}
                              >
                                {statusText[stage.status]}
                              </span>
                            </div>
                            {stage.operator && (
                              <p className="text-xs text-slate-400">
                                操作人: {stage.operator}
                              </p>
                            )}
                            {stage.time && (
                              <p className="text-xs text-slate-500">{stage.time}</p>
                            )}
                            {stage.remark && (
                              <p className="text-xs text-slate-400 mt-1">
                                备注: {stage.remark}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {approval.rejectReason && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-300 mb-1">驳回原因</p>
                              <p className="text-sm text-red-200/80">{approval.rejectReason}</p>
                              {failedStage?.operator && (
                                <p className="text-xs text-red-400/70 mt-2">
                                  驳回人: {failedStage.operator} · {failedStage.time}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {isProcessing && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">审批意见</label>
                            <input
                              type="text"
                              placeholder={approval.currentStage === 'storage' ? '例如：复检合格，血液合格入库' : '例如：检验合格'}
                              value={remark}
                              onChange={(e) => setRemark(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          <div className="flex items-center gap-3 justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRejectModal(approval.id, approval.currentStage);
                              }}
                              className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <X size={16} />
                              驳回
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(approval);
                              }}
                              className={cn(
                                'px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2',
                                approval.currentStage === 'storage'
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              )}
                            >
                              <Check size={16} />
                              {approval.currentStage === 'storage' ? '通过并入库' : '通过'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center">
            <FileCheck size={64} className="mx-auto mb-4 opacity-30" />
            {searchTerm ? (
              <>
                <p className="text-slate-400 text-lg mb-2">未找到匹配的审批记录</p>
                <p className="text-slate-500 text-sm">
                  搜索 "<span className="text-yellow-400">{searchTerm}</span>" 没有找到结果，请尝试其他关键词
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                >
                  清除搜索
                </button>
              </>
            ) : (
              <p className="text-slate-500">暂无审批记录，请在护士端完成采血后生成</p>
            )}
          </div>
        )}
      </div>

      {showRejectModal && pendingRejectData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertOctagon size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  驳回{stageLabels[pendingRejectData.stage]}
                </h3>
                <p className="text-sm text-slate-400">请选择或输入驳回原因</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">快速选择原因</label>
                <div className="flex flex-wrap gap-2">
                  {commonRejectReasons.map(reason => (
                    <button
                      key={reason}
                      onClick={() => setRejectReason(reason)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        rejectReason === reason
                          ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                          : 'bg-slate-700/50 text-slate-300 border border-transparent hover:bg-slate-700'
                      )}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">详细说明</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="请输入具体的驳回原因..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 resize-none h-28"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setPendingRejectData(null);
                }}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
                className={cn(
                  'px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2',
                  rejectReason.trim()
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                )}
              >
                <X size={16} />
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
