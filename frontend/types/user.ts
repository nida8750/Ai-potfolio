export type UserRole = "USER" | "ADMIN";

export interface UserProfile {
  id: string;
  cognitoSub?: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<UserProfile, "cognitoSub">;
