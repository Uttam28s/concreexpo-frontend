function isFeatureEnabled(value: string | undefined): boolean {
  if (value === undefined || value === '') {
    return true;
  }
  
  const normalizedValue = value.toLowerCase().trim();
  return normalizedValue === 'true' || normalizedValue === '1';
}

export const featureFlags = {
  dashboard: () => isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_DASHBOARD),
  appointments: () => isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_APPOINTMENTS),
  inventory: () => isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_INVENTORY),
  workerCounts: () => isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_WORKER_COUNTS),
  reports: () => isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_REPORTS),
  
  clients: () => isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_CLIENTS),
  engineers: () => isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_ENGINEERS),
  materials: () => isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_MATERIALS),
  
  settings: () => isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_SETTINGS),
} as const;
 
export const FEATURE_FLAGS = {
  DASHBOARD: 'NEXT_PUBLIC_FEATURE_DASHBOARD',
  APPOINTMENTS: 'NEXT_PUBLIC_FEATURE_APPOINTMENTS',
  INVENTORY: 'NEXT_PUBLIC_FEATURE_INVENTORY',
  WORKER_COUNTS: 'NEXT_PUBLIC_FEATURE_WORKER_COUNTS',
  REPORTS: 'NEXT_PUBLIC_FEATURE_REPORTS',
  
  CLIENTS: 'NEXT_PUBLIC_FEATURE_CLIENTS',
  ENGINEERS: 'NEXT_PUBLIC_FEATURE_ENGINEERS',
  MATERIALS: 'NEXT_PUBLIC_FEATURE_MATERIALS',
  
  SETTINGS: 'NEXT_PUBLIC_FEATURE_SETTINGS',
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

