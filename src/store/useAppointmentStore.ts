import { create } from 'zustand';
import type { Appointment, BloodVehicle, Position3D } from '@/types';
import { mockAppointments } from '@/data/mockData';
import { getStoredData, setStoredData } from '@/lib/utils';
import { useVehicleStore } from './useVehicleStore';

interface AppointmentState {
  appointments: Appointment[];

  getAppointments: () => Appointment[];
  getAppointmentById: (id: string) => Appointment | undefined;
  getAppointmentsByVehicle: (vehicleId: string) => Appointment[];
  getAppointmentsByStatus: (status: string) => Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => Appointment;
  updateAppointmentStatus: (id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => void;
  deleteAppointment: (id: string) => void;
  findNearestVehicle: (donorPosition?: Position3D) => BloodVehicle | null;
  getAppointmentsByDateRange: (startDate: Date, endDate: Date) => Appointment[];
}

const calculateDistance = (pos1: Position3D, pos2: Position3D): number => {
  const dx = pos1.x - pos2.x;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dz * dz);
};

const getInitialAppointments = (): Appointment[] => {
  const stored = getStoredData<Appointment[]>('appointments', null);
  if (stored && stored.length > 0) {
    return stored;
  }
  return mockAppointments;
};

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: getInitialAppointments(),

  getAppointments: () => {
    return get().appointments;
  },

  getAppointmentById: (id: string) => {
    return get().appointments.find(a => a.id === id);
  },

  getAppointmentsByVehicle: (vehicleId: string) => {
    return get().appointments.filter(a => a.vehicleId === vehicleId);
  },

  getAppointmentsByStatus: (status: string) => {
    return get().appointments.filter(a => a.status === status);
  },

  findNearestVehicle: (donorPosition?: Position3D) => {
    const vehicles = useVehicleStore.getState().vehicles;
    const availableVehicles = vehicles.filter(v => 
      v.status !== 'maintenance'
    );

    if (availableVehicles.length === 0) return null;

    if (!donorPosition) {
      return availableVehicles.reduce((nearest, vehicle) => {
        if (vehicle.reservationCount < nearest.reservationCount) {
          return vehicle;
        }
        return nearest;
      }, availableVehicles[0]);
    }

    return availableVehicles.reduce((nearest, vehicle) => {
      const distance = calculateDistance(donorPosition, vehicle.position);
      const nearestDistance = calculateDistance(donorPosition, nearest.position);
      if (distance < nearestDistance) {
        return vehicle;
      }
      return nearest;
    }, availableVehicles[0]);
  },

  addAppointment: (appointmentData) => {
    const newAppointment: Appointment = {
      id: `appt${Date.now()}`,
      ...appointmentData,
      status: 'pending',
    };

    set(state => {
      const newAppointments = [newAppointment, ...state.appointments];
      setStoredData('appointments', newAppointments);
      return { appointments: newAppointments };
    });

    useVehicleStore.getState().incrementReservationCount(appointmentData.vehicleId);

    return newAppointment;
  },

  updateAppointmentStatus: (id: string, status) => {
    set(state => {
      const appointment = state.appointments.find(a => a.id === id);
      const newAppointments = state.appointments.map(a =>
        a.id === id ? { ...a, status } : a
      );
      setStoredData('appointments', newAppointments);
      
      if (appointment && status === 'cancelled') {
        useVehicleStore.getState().decrementReservationCount(appointment.vehicleId);
      }
      
      return { appointments: newAppointments };
    });
  },

  deleteAppointment: (id: string) => {
    set(state => {
      const appointment = state.appointments.find(a => a.id === id);
      const newAppointments = state.appointments.filter(a => a.id !== id);
      setStoredData('appointments', newAppointments);
      
      if (appointment && appointment.status !== 'completed' && appointment.status !== 'cancelled') {
        useVehicleStore.getState().decrementReservationCount(appointment.vehicleId);
      }
      
      return { appointments: newAppointments };
    });
  },

  getAppointmentsByDateRange: (startDate: Date, endDate: Date) => {
    return get().appointments.filter(a => {
      const appointmentDate = new Date(a.time);
      return appointmentDate >= startDate && appointmentDate <= endDate;
    });
  },
}));
