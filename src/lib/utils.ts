import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const STORAGE_PREFIX = 'blood_donation_';

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch {
    console.error('Failed to save data to localStorage');
  }
}

export function clearStoredData(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    console.error('Failed to clear data from localStorage');
  }
}
