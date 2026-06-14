import { create } from 'zustand';
import type { Appointment, BloodVehicle, Position3D } from '@/types';
import { mockAppointments, mockVehicles } from '@/data/mockData';

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

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: mockAppointments,

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
    const availableVehicles = mockVehicles.filter(v => 
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

    set(state => ({
      appointments: [newAppointment, ...state.appointments],
    }));

    return newAppointment;
  },

  updateAppointmentStatus: (id: string, status) => {
    set(state => ({
      appointments: state.appointments.map(a =>
        a.id === id ? { ...a, status } : a
      ),
    }));
  },

  deleteAppointment: (id: string) => {
    set(state => ({
      appointments: state.appointments.filter(a => a.id !== id),
    }));
  },

  getAppointmentsByDateRange: (startDate: Date, endDate: Date) => {
    return get().appointments.filter(a => {
      const appointmentDate = new Date(a.time);
      return appointmentDate >= startDate && appointmentDate <= endDate;
    });
  },
}));
