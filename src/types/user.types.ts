export type UserStatus = "active" | "suspended";

export interface Permission {
  id: string;
  key: string;
  label: string;
  category: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  label: string;
  description: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  roles?: Role[];
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: any;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}
