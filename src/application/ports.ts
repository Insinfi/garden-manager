import type { GardenData } from "../domain/garden";

export type GardenRepository = {
  mode: "local" | "cloud";
  load: () => Promise<GardenData>;
  save: (garden: GardenData) => Promise<void>;
};

export type AuthSession = {
  user: {
    id: string;
    email?: string | null;
  };
};

export type AuthRepository = {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  getSession: () => Promise<AuthSession | null>;
  onSessionChange: (listener: (session: AuthSession | null) => void) => () => void;
};
