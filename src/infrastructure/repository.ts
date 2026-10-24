import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { AuthRepository, GardenRepository } from "../application/ports";
import type { GardenData } from "../domain/garden";
import { emptyGarden } from "../domain/garden";

const localKey = "jardinier:potager:v1";

export const localRepository: GardenRepository = {
  mode: "local",
  async load() {
    const stored = window.localStorage.getItem(localKey);
    if (!stored) return emptyGarden();
    try {
      const parsed: unknown = JSON.parse(stored);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "schemaVersion" in parsed &&
        parsed.schemaVersion === 1 &&
        "areas" in parsed &&
        Array.isArray(parsed.areas) &&
        "plants" in parsed &&
        Array.isArray(parsed.plants) &&
        "tasks" in parsed &&
        Array.isArray(parsed.tasks)
      ) {
        return parsed as GardenData;
      }
    } catch {
      throw new Error("Les données locales sont illisibles. Elles n’ont pas été remplacées.");
    }
    throw new Error("Le format des données locales n’est pas reconnu.");
  },
  async save(garden) {
    window.localStorage.setItem(localKey, JSON.stringify(garden));
  },
};

const environment = import.meta.env as ImportMetaEnv;
const supabaseUrl = environment.VITE_SUPABASE_URL;
const supabaseKey = environment.VITE_SUPABASE_ANON_KEY;
export const cloudConfigurationIncomplete =
  Boolean(supabaseUrl) !== Boolean(supabaseKey);
export const cloudEnabled = Boolean(supabaseUrl && supabaseKey);

const client: SupabaseClient | null = cloudEnabled
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

function cloudError(message: string): never {
  throw new Error(message);
}

export const cloudRepository: GardenRepository = {
  mode: "cloud",
  async load() {
    if (!client) return cloudError("Le service en ligne n’est pas configuré.");
    const { data, error } = await client
      .from("gardens")
      .select("garden_data")
      .maybeSingle();
    if (error) throw new Error(`Impossible de charger le potager : ${error.message}`);
    if (!data) return emptyGarden();
    const garden = data.garden_data as GardenData;
    if (
      garden?.schemaVersion !== 1 ||
      !Array.isArray(garden.areas) ||
      !Array.isArray(garden.plants) ||
      !Array.isArray(garden.tasks)
    ) {
      throw new Error("Le format du potager en ligne n’est pas reconnu.");
    }
    return garden;
  },
  async save(garden) {
    if (!client) return cloudError("Le service en ligne n’est pas configuré.");
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw new Error(`Session indisponible : ${sessionError.message}`);
    const ownerId = sessionData.session?.user.id;
    if (!ownerId) throw new Error("Votre session a expiré. Reconnectez-vous avant d’enregistrer.");
    const { error } = await client
      .from("gardens")
      .upsert(
        { owner_id: ownerId, garden_data: garden, updated_at: new Date().toISOString() },
        { onConflict: "owner_id" },
      );
    if (error) throw new Error(`Échec de la synchronisation : ${error.message}`);
  },
};

export const authRepository: AuthRepository | null = client
  ? {
      async signIn(email, password) {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
      },
      async signUp(email, password) {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) throw new Error(error.message);
        return data.session
          ? null
          : "Consultez votre boîte mail pour confirmer votre inscription, puis connectez-vous.";
      },
      async signOut() {
        const { error } = await client.auth.signOut();
        if (error) throw new Error(error.message);
      },
      async getSession() {
        const { data, error } = await client.auth.getSession();
        if (error) throw new Error(error.message);
        return data.session;
      },
      onSessionChange(listener) {
        const { data } = client.auth.onAuthStateChange((_event, session) => listener(session));
        return () => data.subscription.unsubscribe();
      },
    }
  : null;
