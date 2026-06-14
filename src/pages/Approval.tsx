import { useState } from 'react';
import { FileCheck, Clock, User, Check, X, Search, Filter, ChevronRight } from 'lucide-react';
import { useApprovalStore } from '@/store/useApprovalStore';
import type { ApprovalStage, ApprovalStatus } from '@/types';
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

export default function Approval() {
  const approvals = useApprovalStore((state) => state.approvals);
  const updateApprovalStage = useApprovalStore((state) => state.updateApprovalStage);
  const [filter, setFilter] = useState<ApprovalStage | 'all'>('all');
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [remark, setRemark] = useState('');

  const filteredApprovals = approvals.filter((a) => {
    return filter === 'all' || a.currentStage === filter;
  });

  const handleApprove = (id: string, stage: ApprovalStage) => {
    updateApprovalStage(id, stage, 'passed', '张主任', remark || '审批通过');
    setSelectedApproval(null);
    setRemark('');
  };

  const handleReject = (id: string, stage: ApprovalStage) => {
    updateApprovalStage(id, stage, 'failed', '张主任', remark || '审批未通过');
    setSelectedApproval(null);
    setRemark('');
  };

  const getCurrentStageIndex = (stage: ApprovalStage) => stageOrder.indexOf(stage);

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <FileCheck className="text-yellow-500" />
          审批中心
        </h1>
        <p className="text-slate-400">初筛-复检-入库三级审批流程管理</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stageOrder.map((stage) => {
          const count = approvals.filter(
            (a) => a.currentStage === stage && a.stages[getCurrentStageIndex(stage)]?.status === 'processing'
          ).length;
          return (
            <div
              key={stage}
              className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{stageLabels[stage]}</h3>
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold',
                    statusColors.processing
                  )}
                >
                  {count}
                </div>
              </div>
              <p className="text-sm text-slate-400">
                待处理 {count} 项
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="搜索条码/姓名..."
              className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500 w-64"
            />
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
          共 <span className="text-white font-medium">{filteredApprovals.length}</span> 条记录
        </div>
      </div>

      <div className="space-y-4">
        {filteredApprovals.map((approval) => {
          const currentStageIdx = getCurrentStageIndex(approval.currentStage);
          const isProcessing = approval.stages[currentStageIdx]?.status === 'processing';

          return (
            <div
              key={approval.id}
              className={cn(
                'bg-slate-900/50 backdrop-blur-xl rounded-xl border overflow-hidden transition-all duration-300',
                selectedApproval === approval.id
                  ? 'border-yellow-500 ring-2 ring-yellow-500/20'
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
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">
                      {approval.bloodType}型 / {approval.volume}ml
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
                              idx < currentStageIdx ? 'bg-green-500' : 'bg-slate-700'
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

                    {isProcessing && (
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="输入审批意见..."
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(approval.id, approval.currentStage);
                          }}
                          className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <X size={16} />
                          驳回
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(approval.id, approval.currentStage);
                          }}
                          className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Check size={16} />
                          通过
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredApprovals.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          <FileCheck size={48} className="mx-auto mb-3 opacity-50" />
          <p>暂无审批记录</p>
        </div>
      )}
    </div>
  );
}
