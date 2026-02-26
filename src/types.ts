export type Role = 'family' | 'care_manager' | 'operator';

export interface Patient {
  id: string;
  name: string;
  requiresWheelchair: boolean;
  hasNursingInsurance: boolean;
}

export interface Operator {
  id: string;
  name: string;
}

export interface Vehicle {
  id: string;
  operatorId: string;
  name: string;
  isWheelchairAccessible: boolean;
  acceptsInsurance: boolean;
}

export interface Booking {
  id: string;
  patientId: string;
  operatorId: string;
  vehicleId?: string;
  pickupDatetime: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  requiresWheelchair: boolean;
  useInsurance: boolean;
}
