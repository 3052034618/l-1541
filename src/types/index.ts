export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface BloodInventory {
  A: number;
  B: number;
  O: number;
  AB: number;
}

export type VehicleStatus = 'idle' | 'moving' | 'collecting' | 'maintenance';

export type DeviceStatus = 'normal' | 'warning' | 'error';

export type DeviceType = 'collection' | 'refrigeration' | 'power';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  lastCheck: string;
}

export interface CollectionRecord {
  id: string;
  donorId: string;
  donorName: string;
  bloodType: 'A' | 'B' | 'O' | 'AB';
  volume: number;
  barcode: string;
  collectionTime: string;
  vehicleId: string;
}

export interface BloodVehicle {
  id: string;
  number: string;
  position: Position3D;
  targetPosition?: Position3D;
  status: VehicleStatus;
  inventory: BloodInventory;
  reservationCount: number;
  devices: Device[];
  collectionRecords: CollectionRecord[];
  driverName: string;
  nurseName: string;
}

export type StationType = 'station' | 'donation_point' | 'emergency_center' | 'mall';

export interface BloodStation {
  id: string;
  name: string;
  type: StationType;
  position: Position3D;
  inventory?: BloodInventory;
  address: string;
  phone: string;
}

export type ApprovalStage = 'initial_screening' | 'recheck' | 'storage';

export type ApprovalStatus = 'pending' | 'processing' | 'passed' | 'failed';

export interface ApprovalStageItem {
  name: string;
  status: ApprovalStatus;
  operator?: string;
  time?: string;
  remark?: string;
}

export interface BloodApproval {
  id: string;
  barcode: string;
  donorName: string;
  bloodType: string;
  volume: number;
  currentStage: ApprovalStage;
  stages: ApprovalStageItem[];
  createTime: string;
  vehicleId: string;
}

export type UserRole = 'donor' | 'nurse' | 'director';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  lastLogin: string;
  phone: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  donorId: string;
  donorName: string;
  vehicleId: string;
  time: string;
  status: AppointmentStatus;
  bloodType?: string;
}

export interface OperationLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  time: string;
  ip: string;
}

export interface PathPoint {
  x: number;
  z: number;
}

export interface DispatchRoute {
  id: string;
  vehicleId: string;
  startPoint: Position3D;
  endPoint: Position3D;
  path: PathPoint[];
  status: 'active' | 'completed';
  startTime: string;
  estimatedArrival: string;
}
