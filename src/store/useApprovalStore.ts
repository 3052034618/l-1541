import { create } from 'zustand';
import type { BloodApproval, ApprovalStatus, ApprovalStage } from '@/types';
import { mockApprovals } from '@/data/mockData';
import { getStoredData, setStoredData } from '@/lib/utils';

interface ApprovalState {
  approvals: BloodApproval[];

  getApprovalById: (id: string) => BloodApproval | undefined;
  getApprovalsByStage: (stage: ApprovalStage) => BloodApproval[];
  getApprovalsByVehicle: (vehicleId: string) => BloodApproval[];
  updateApprovalStage: (id: string, stage: ApprovalStage, status: ApprovalStatus, operator: string, remark?: string) => void;
  getPendingCount: () => number;
  addApproval: (approval: BloodApproval) => void;
  getApprovalsByDateRange: (startDate: Date, endDate: Date) => BloodApproval[];
}

const stageOrder: ApprovalStage[] = ['initial_screening', 'recheck', 'storage'];

const getInitialApprovals = (): BloodApproval[] => {
  const stored = getStoredData<BloodApproval[]>('approvals', null);
  if (stored && stored.length > 0) {
    return stored;
  }
  return mockApprovals;
};

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  approvals: getInitialApprovals(),

  getApprovalById: (id: string) => {
    return get().approvals.find(a => a.id === id);
  },

  getApprovalsByStage: (stage: ApprovalStage) => {
    return get().approvals.filter(a => a.currentStage === stage);
  },

  getApprovalsByVehicle: (vehicleId: string) => {
    return get().approvals.filter(a => a.vehicleId === vehicleId);
  },

  updateApprovalStage: (id: string, stage: ApprovalStage, status: ApprovalStatus, operator: string, remark?: string) => {
    set(state => {
      const newApprovals = state.approvals.map(approval => {
        if (approval.id !== id) return approval;

        const stageIndex = stageOrder.indexOf(stage);
        const updatedStages = approval.stages.map((s, idx) => {
          if (idx === stageIndex) {
            return {
              ...s,
              status,
              operator,
              time: new Date().toISOString(),
              remark,
            };
          }
          return s;
        });

        let nextStage = stage;
        if (status === 'passed' && stageIndex < stageOrder.length - 1) {
          nextStage = stageOrder[stageIndex + 1];
          updatedStages[stageIndex + 1] = {
            ...updatedStages[stageIndex + 1],
            status: 'processing',
          };
        }

        return {
          ...approval,
          stages: updatedStages,
          currentStage: nextStage,
        };
      });
      setStoredData('approvals', newApprovals);
      return { approvals: newApprovals };
    });
  },

  getPendingCount: () => {
    return get().approvals.filter(a => {
      const currentStageIdx = stageOrder.indexOf(a.currentStage);
      return a.stages[currentStageIdx]?.status === 'processing';
    }).length;
  },

  addApproval: (approval: BloodApproval) => {
    set(state => {
      const newApprovals = [approval, ...state.approvals];
      setStoredData('approvals', newApprovals);
      return { approvals: newApprovals };
    });
  },

  getApprovalsByDateRange: (startDate: Date, endDate: Date) => {
    return get().approvals.filter(a => {
      const createDate = new Date(a.createTime);
      return createDate >= startDate && createDate <= endDate;
    });
  },
}));
