import { create } from 'zustand';
import type { BloodVehicle, DispatchRoute, CollectionRecord } from '@/types';
import { mockVehicles, mockDispatchRoutes } from '@/data/mockData';

interface VehicleState {
  vehicles: BloodVehicle[];
  selectedVehicleId: string | null;
  routes: DispatchRoute[];

  selectVehicle: (id: string | null) => void;
  getVehicleById: (id: string) => BloodVehicle | undefined;
  updateVehiclePosition: (id: string, position: { x: number; y: number; z: number }) => void;
  addCollectionRecord: (vehicleId: string, record: CollectionRecord) => void;
  getSelectedVehicle: () => BloodVehicle | undefined;
  getActiveRoutes: () => DispatchRoute[];
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: mockVehicles,
  selectedVehicleId: null,
  routes: mockDispatchRoutes,

  selectVehicle: (id: string | null) => {
    set({ selectedVehicleId: id });
  },

  getVehicleById: (id: string) => {
    return get().vehicles.find(v => v.id === id);
  },

  updateVehiclePosition: (id: string, position: { x: number; y: number; z: number }) => {
    set(state => ({
      vehicles: state.vehicles.map(v =>
        v.id === id ? { ...v, position } : v
      ),
    }));
  },

  addCollectionRecord: (vehicleId: string, record: CollectionRecord) => {
    set(state => ({
      vehicles: state.vehicles.map(v =>
        v.id === vehicleId
          ? {
              ...v,
              collectionRecords: [record, ...v.collectionRecords],
              inventory: {
                ...v.inventory,
                [record.bloodType]: v.inventory[record.bloodType as keyof typeof v.inventory] + record.volume / 100,
              },
            }
          : v
      ),
    }));
  },

  getSelectedVehicle: () => {
    const { vehicles, selectedVehicleId } = get();
    return vehicles.find(v => v.id === selectedVehicleId);
  },

  getActiveRoutes: () => {
    return get().routes.filter(r => r.status === 'active');
  },
}));
