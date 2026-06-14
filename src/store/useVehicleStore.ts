import { create } from 'zustand';
import type { BloodVehicle, DispatchRoute, CollectionRecord } from '@/types';
import { mockVehicles, mockDispatchRoutes } from '@/data/mockData';
import { getStoredData, setStoredData } from '@/lib/utils';

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
  incrementReservationCount: (vehicleId: string) => void;
  decrementReservationCount: (vehicleId: string) => void;
}

const getInitialVehicles = (): BloodVehicle[] => {
  const stored = getStoredData<BloodVehicle[]>('vehicles', null);
  if (stored && stored.length > 0) {
    return stored;
  }
  return mockVehicles;
};

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: getInitialVehicles(),
  selectedVehicleId: null,
  routes: mockDispatchRoutes,

  selectVehicle: (id: string | null) => {
    set({ selectedVehicleId: id });
  },

  getVehicleById: (id: string) => {
    return get().vehicles.find(v => v.id === id);
  },

  updateVehiclePosition: (id: string, position: { x: number; y: number; z: number }) => {
    set(state => {
      const newVehicles = state.vehicles.map(v =>
        v.id === id ? { ...v, position } : v
      );
      setStoredData('vehicles', newVehicles);
      return { vehicles: newVehicles };
    });
  },

  addCollectionRecord: (vehicleId: string, record: CollectionRecord) => {
    set(state => {
      const newVehicles = state.vehicles.map(v =>
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
      );
      setStoredData('vehicles', newVehicles);
      return { vehicles: newVehicles };
    });
  },

  getSelectedVehicle: () => {
    const { vehicles, selectedVehicleId } = get();
    return vehicles.find(v => v.id === selectedVehicleId);
  },

  getActiveRoutes: () => {
    return get().routes.filter(r => r.status === 'active');
  },

  incrementReservationCount: (vehicleId: string) => {
    set(state => {
      const newVehicles = state.vehicles.map(v =>
        v.id === vehicleId
          ? { ...v, reservationCount: v.reservationCount + 1 }
          : v
      );
      setStoredData('vehicles', newVehicles);
      return { vehicles: newVehicles };
    });
  },

  decrementReservationCount: (vehicleId: string) => {
    set(state => {
      const newVehicles = state.vehicles.map(v =>
        v.id === vehicleId
          ? { ...v, reservationCount: Math.max(0, v.reservationCount - 1) }
          : v
      );
      setStoredData('vehicles', newVehicles);
      return { vehicles: newVehicles };
    });
  },
}));
