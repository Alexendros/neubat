export interface Installation {
  token: string;
  machine_id?: string;
  profile: string;
  status: 'pending' | 'downloaded' | 'completed' | 'failed';
  created_at: string;
  downloaded_at?: string;
  completed_at?: string;
  hostname?: string;
  error?: string;
}

export interface InstallRequest {
  profile: string;
  hostname?: string;
  username?: string;
  desktop?: string;
  packages?: string[];
}

export interface InstallResponse {
  success: boolean;
  token: string;
  machine_id: string;
  config_url: string;
  boot_url: string;
  message: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
}
