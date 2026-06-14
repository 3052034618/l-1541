import { create } from 'zustand';
import type { BloodApproval, ApprovalStatus, ApprovalStage } from '@/types';
import { mockApprovals } from '@/data/mockData';

interface ApprovalState {
  approvals: BloodApproval[];

  getApprovalById: (id: string) => BloodApproval | undefined;
  getApprovalsByStage: (stage: ApprovalStage) => BloodApproval[];
  getApprovalsByVehicle: (vehicleId: string) => BloodApproval[];
  updateApprovalStage: (id: string, stage: ApprovalStage, status: ApprovalStatus, operator: string, remark?: string) => void;
  getPendingCount: () => number;
  addApproval: (approval: BloodApproval) => void;
}

const stageOrder: ApprovalStage[] = ['initial_screening', 'recheck', 'storage'];

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  approvals: mockApprovals,

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
    set(state => ({
      approvals: state.approvals.map(approval => {
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
      }),
    }));
  },

  getPendingCount: () => {
    return get().approvals.filter(a => {
      const currentStageIdx = stageOrder.indexOf(a.currentStage);
      return a.stages[currentStageIdx]?.status === 'processing';
    }).length;
  },

  addApproval: (approval: BloodApproval) => {
    set(state => ({
      approvals: [approval, ...state.approvals],
    }));
  },
}));
