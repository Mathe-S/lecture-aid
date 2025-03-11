export type UserRole = "admin" | "instructor" | "student" | "guest";

export interface ProfileRecord {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

export type User = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
};
