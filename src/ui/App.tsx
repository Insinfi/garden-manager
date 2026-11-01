import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cloud,
  Leaf,
  LogOut,
  Map,
  Plus,
  Sprout,
  Sun,
  X,
} from "lucide-react";
import { emptyGarden } from "../domain/garden";
import type { GardenArea, GardenData, GardenPlant, GardenTask } from "../domain/garden";
import { requestAdvice } from "../domain/guidance";
import type { GardenAdvice } from "../domain/guidance";
import {
  addPlant as addPlantUseCase,
  loadGarden,
  placeArea as placeAreaUseCase,
  saveGarden,
  saveTask as saveTaskUseCase,
  updateArea as updateAreaUseCase,
  validateAreaDraft,
} from "../application/gardenUseCases";
import type { AuthSession, GardenRepository } from "../application/ports";
import {
  authRepository,
  cloudEnabled,
  cloudConfigurationIncomplete,
  cloudRepository,
  localRepository,
} from "../infrastructure/repository";

const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("fr-BE", { month: "long", year: "numeric" }).format(date);
const longDate = (value: string) =>
  new Intl.DateTimeFormat("fr-BE", { dateStyle: "full" }).format(new Date(`${value}T12:00:00`));
const id = () => crypto.randomUUID();
const isoToday = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};
const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function AuthScreen({ initialError = "" }: { initialError?: string }) {
  const [signingUp, setSigningUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (!authRepository) throw new Error("La connexion en ligne n’est pas configurée.");
      const result = signingUp
        ? await authRepository.signUp(email, password)
        : await authRepository.signIn(email, password);
      setMessage(result ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-heading">
        <div className="brand-mark"><Sprout aria-hidden="true" /></div>
        <p className="eyebrow">MON JARDIN, À MON RYTHME</p>
        <h1 id="auth-heading">{signingUp ? "Créer mon accès" : "Retrouver mon potager"}</h1>
        <p className="auth-copy">
          Connectez-vous pour retrouver votre plan et vos tâches sur vos appareils.
        </p>
        {initialError && <p className="form-message" role="alert">{initialError}</p>}
        <form className="stack-form" onSubmit={submit}>
          <label htmlFor="auth-email">Adresse e-mail</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="auth-password">Mot de passe</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={signingUp ? "new-password" : "current-password"}
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {message && <p className="form-message" role="status">{message}</p>}
          <button className="button button-primary" disabled={busy} type="submit">
            {busy ? "Patientez…" : signingUp ? "Créer mon compte" : "Me connecter"}
          </button>
        </form>
        <button className="text-button auth-switch" onClick={() => setSigningUp(!signingUp)} type="button">
          {signingUp ? "J’ai déjà un compte" : "Créer un compte"}
        </button>
        <p className="privacy-note">
          Votre jardin reste privé. Les accès et sauvegardes dépendent du service en ligne choisi.
        </p>
      </section>
    </main>
  );
}

type ModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

function Modal({ title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const target = dialogRef.current?.querySelector<HTMLElement>(".stack-form input, .stack-form select, .stack-form button") ??
      dialogRef.current?.querySelector<HTMLElement>("button");
    target?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  function keepFocusInside(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]',
      ) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section ref={dialogRef} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" onKeyDown={keepFocusInside}>
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" type="button" aria-label="Fermer" onClick={onClose}>
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function App() {
  const repository: GardenRepository = cloudEnabled ? cloudRepository : localRepository;
  const [view, setView] = useState<"planning" | "plan">("planning");
  const [garden, setGarden] = useState<GardenData>(emptyGarden());
  const gardenRef = useRef(garden);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(!cloudEnabled);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [loadError, setLoadError] = useState("");
  const [taskScope, setTaskScope] = useState<"date" | "all">("date");
  const [notice, setNotice] = useState("");
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const saveSequence = useRef(0);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [areaModal, setAreaModal] = useState(false);
  const [plantModal, setPlantModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [editingArea, setEditingArea] = useState<GardenArea | null>(null);
  const [editingTask, setEditingTask] = useState<GardenTask | null>(null);
  const [adviceFor, setAdviceFor] = useState<GardenPlant | null>(null);
  const [selectedDay, setSelectedDay] = useState(isoToday());
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [placing, setPlacing] = useState<{
    id: string;
    mode: "new" | "move";
    name: string;
    widthM: number;
    lengthM: number;
    xM: number;
    yM: number;
  } | null>(null);
  const pendingPlantId = useRef<string | null>(null);
  const pendingTaskId = useRef<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authRepository) return;
    let active = true;
    void authRepository.getSession().then((found) => {
      if (active) {
        setSession(found);
        setAuthReady(true);
      }
    }).catch((error: unknown) => {
      if (active) {
        setLoadError(error instanceof Error ? error.message : "Connexion impossible.");
        setAuthReady(true);
      }
    });
    const unsubscribe = authRepository.onSessionChange((found) => {
      if (active) setSession(found);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (cloudEnabled && !session) return;
    let active = true;
    setLoading(true);
    setLoadError("");
    void loadGarden(repository).then((result) => {
      if (!active) return;
      const next = result.garden;
      gardenRef.current = next;
      setGarden(next);
      setSelectedAreaId((selected) =>
        selected && next.areas.some((area) => area.id === selected)
          ? selected
          : next.areas[0]?.id ?? "",
      );
      if (result.hasNewSuggestions) {
        void persist(next, "Suggestions saisonnières actualisées.").catch(() => undefined);
      }
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : "Chargement impossible.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  // Refresh the saved garden after authentication changes, not after local edits.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  function persist(next: GardenData, confirmation = "Modifications enregistrées."): Promise<void> {
    const sequence = ++saveSequence.current;
    setSaveState("saving");
    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(() => saveGarden(repository, next));
    return saveQueue.current.then(() => {
      if (sequence === saveSequence.current) {
        setSaveState("saved");
        setNotice(confirmation);
        window.setTimeout(() => setNotice(""), 3500);
      }
    }).catch((error: unknown) => {
      if (sequence === saveSequence.current) {
        setSaveState("error");
        setNotice(error instanceof Error ? error.message : "Échec de l’enregistrement. Réessayez.");
      }
      throw error;
    });
  }

  async function commit(next: GardenData, confirmation?: string): Promise<boolean> {
    gardenRef.current = next;
    setGarden(next);
    try {
      await persist(next, confirmation);
      return true;
    } catch {
      return false;
    }
  }

  async function reload() {
    setLoading(true);
    setLoadError("");
    try {
      const result = await loadGarden(repository);
      const next = result.garden;
      gardenRef.current = next;
      setGarden(next);
      if (result.hasNewSuggestions) {
        void persist(next, "Suggestions saisonnières actualisées.").catch(() => undefined);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  function retrySave() {
    void persist(gardenRef.current, "Synchronisation terminée.").then(() => {
      if (placing && gardenRef.current.areas.some((area) => area.id === placing.id)) {
        setSelectedAreaId(placing.id);
        setPlacing(null);
      }
    }).catch(() => undefined);
  }

  async function signOut() {
    try {
      await authRepository?.signOut();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "La déconnexion a échoué.");
    }
  }

  function startReposition(area: GardenArea) {
    if (editingDisabled) return;
    setPlacing({
      id: area.id,
      mode: "move",
      name: area.name,
      widthM: area.widthM,
      lengthM: area.lengthM,
      xM: area.xM,
      yM: area.yM,
    });
    setNotice(`Déplacement de ${area.name} : utilisez les flèches ou touchez le plan.`);
    window.setTimeout(() => mapRef.current?.focus(), 0);
  }

  const selectedArea = garden.areas.find((area) => area.id === selectedAreaId) ?? null;
  const mapWidthM = Math.max(
    12,
    ...garden.areas.map((area) => area.xM + area.widthM + 2),
    ...(placing ? [placing.xM + placing.widthM + 2] : []),
  );
  const mapHeightM = Math.max(
    7,
    ...garden.areas.map((area) => area.yM + area.lengthM + 2),
    ...(placing ? [placing.yM + placing.lengthM + 2] : []),
  );
  const tasksForDay = garden.tasks
    .filter((task) => task.date === selectedDay)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  const chronologicalTasks = [...garden.tasks]
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  const visibleTasks = taskScope === "date" ? tasksForDay : chronologicalTasks;
  const taskDays = useMemo(() => new Set(garden.tasks.map((task) => task.date)), [garden.tasks]);

  async function addArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const widthM = Number(form.get("width"));
    const lengthM = Number(form.get("length"));
    const error = validateAreaDraft({ name, widthM, lengthM });
    if (error) {
      setNotice(error);
      return;
    }
    if (editingArea) {
      const result = updateAreaUseCase(gardenRef.current, editingArea.id, { name, widthM, lengthM });
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      if (await commit(result.value, "Zone modifiée.")) {
        setAreaModal(false);
        setEditingArea(null);
      }
      return;
    }
    setPlacing({ id: id(), mode: "new", name: name.trim(), widthM, lengthM, xM: 1, yM: 1 });
    setAreaModal(false);
    setNotice("Zone prête à placer. Cliquez sur le plan ou utilisez les flèches puis Entrée.");
    window.setTimeout(() => mapRef.current?.focus(), 0);
  }

  async function placeArea(xM: number, yM: number) {
    if (!placing) return;
    const result = placeAreaUseCase(gardenRef.current, {
      ...placing,
      xM,
      yM,
    });
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    if (await commit(result.value, placing.mode === "move" ? "Zone déplacée sur le plan." : "Zone ajoutée au plan.")) {
      setSelectedAreaId(placing.id);
      setPlacing(null);
    }
  }

  function handleMapKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!placing || event.target !== event.currentTarget) return;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -0.5],
      ArrowDown: [0, 0.5],
      ArrowLeft: [-0.5, 0],
      ArrowRight: [0.5, 0],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      setPlacing((position) => position
        ? {
            ...position,
            xM: Math.max(0, position.xM + move[0]),
            yM: Math.max(0, position.yM + move[1]),
          }
        : null);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void placeArea(placing.xM, placing.yM);
    } else if (event.key === "Escape") {
      if (saveState === "error") {
        setNotice("L’enregistrement a échoué. Réessayez avant de quitter ce placement pour ne pas perdre votre modification.");
        return;
      }
      setPlacing(null);
      setNotice(placing.mode === "move"
        ? "Déplacement annulé. La zone reste à son emplacement précédent."
        : "Placement annulé. La zone n’a pas été enregistrée.");
    }
  }

  function handleMapClick(event: MouseEvent<HTMLDivElement>) {
    if (!placing || event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const xM = ((event.clientX - rect.left) / rect.width) * mapWidthM;
    const yM = ((event.clientY - rect.top) / rect.height) * mapHeightM;
    void placeArea(xM - placing.widthM / 2, yM - placing.lengthM / 2);
  }

  async function addPlant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const areaId = String(form.get("areaId") ?? "");
    const plantedOn = String(form.get("plantedOn") ?? "");
    const result = addPlantUseCase(gardenRef.current, {
      name,
      kind: form.get("kind") === "tree" ? "tree" : "plant",
      areaId,
      plantedOn,
    }, pendingPlantId.current ?? id());
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    if (await commit(result.value, "Plante ajoutée au plan.")) {
      setSelectedAreaId(areaId);
      setPlantModal(false);
      pendingPlantId.current = null;
    }
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "");
    const date = String(form.get("date") ?? "");
    const result = saveTaskUseCase(
      gardenRef.current,
      { title, date },
      pendingTaskId.current ?? id(),
      editingTask ?? undefined,
    );
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    if (await commit(result.value, editingTask ? "Tâche modifiée." : "Tâche personnelle ajoutée.")) {
      setTaskModal(false);
      setEditingTask(null);
      pendingTaskId.current = null;
      setSelectedDay(date);
      setMonth(new Date(`${date}T00:00:00`));
    }
  }

  function openTask(task?: GardenTask) {
    setEditingTask(task ?? null);
    pendingTaskId.current = task ? null : id();
    setTaskModal(true);
  }

  function selectCalendarDate(value: string) {
    setSelectedDay(value);
    const date = new Date(`${value}T12:00:00`);
    if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  const areaPlants = selectedArea
    ? garden.plants.filter((plant) => plant.areaId === selectedArea.id)
    : [];
  const saveLabel = loading
    ? "Chargement du potager"
    : saveState === "saving"
    ? "Enregistrement en cours"
    : saveState === "error"
      ? "Échec de l’enregistrement"
      : repository.mode === "cloud"
        ? "Synchronisé"
        : "Enregistré sur cet appareil";
  const editingDisabled = loading || Boolean(loadError) || saveState === "saving";

  function exportGarden() {
    const blob = new Blob([JSON.stringify(gardenRef.current, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mon-potager-${isoToday()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Export JSON téléchargé sur cet appareil.");
  }

  if (cloudConfigurationIncomplete) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-mark"><Sprout aria-hidden="true" /></div>
          <p className="eyebrow">CONFIGURATION INCOMPLÈTE</p>
          <h1>Connexion non activée</h1>
          <p className="auth-copy">Renseignez ensemble l’URL du projet Supabase et sa clé publishable dans un fichier local <code>.env.local</code>. Aucune donnée ne sera basculée silencieusement en mode local.</p>
        </section>
      </main>
    );
  }
  if (cloudEnabled && !authReady) {
    return <main className="auth-page"><p role="status">Vérification de votre session…</p></main>;
  }
  if (cloudEnabled && !session) return <AuthScreen initialError={loadError} />;

  const startDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (startDay.getDay() + 6) % 7;
  const calendarStart = new Date(startDay);
  calendarStart.setDate(1 - mondayOffset);
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    return day;
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Sprout aria-hidden="true" /></span>
          <span><strong>jardinier</strong><small>Mon potager</small></span>
        </div>
        <p className="nav-caption">MON ESPACE</p>
        <nav className="primary-nav" aria-label="Navigation principale">
          <button
            className={view === "planning" ? "nav-item active" : "nav-item"}
            aria-current={view === "planning" ? "page" : undefined}
            onClick={() => setView("planning")}
          >
            <CalendarDays aria-hidden="true" size={19} /> Planning
          </button>
          <button
            className={view === "plan" ? "nav-item active" : "nav-item"}
            aria-current={view === "plan" ? "page" : undefined}
            onClick={() => setView("plan")}
          >
            <Map aria-hidden="true" size={19} /> Plan
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="season-card">
            <span className="season-icon"><Sun aria-hidden="true" size={18} /></span>
            <span><strong>Un pas à la fois</strong><small>Votre jardin évolue avec vous.</small></span>
          </div>
          {cloudEnabled && session && (
            <button className="account-button" disabled={saveState !== "saved"} onClick={() => void signOut()}>
              <LogOut aria-hidden="true" size={17} /> Se déconnecter
            </button>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Mon jardin</span><span aria-hidden="true">/</span><strong>{view === "planning" ? "Planning" : "Plan"}</strong></div>
          <div className="topbar-actions">
            <span className={`save-indicator ${saveState}`} aria-live="polite">
              {saveState === "saving" || loading ? <span className="spinner" aria-hidden="true" /> : saveState === "error" ? <CircleHelp size={16} aria-hidden="true" /> : repository.mode === "cloud" ? <Cloud size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
              {saveLabel}
            </span>
            {saveState === "error" && <button className="small-button" onClick={retrySave}>Réessayer</button>}
            <button className="export-button" onClick={exportGarden}>Exporter mes données</button>
            {cloudEnabled && session && <span className="user-chip">{session.user.email}</span>}
          </div>
        </header>

        {repository.mode === "local" && (
          <div className="local-banner" role="note">
            <strong>Mode local</strong> — ces données restent dans ce navigateur et ne sont pas synchronisées.
            Configurez Supabase pour les retrouver sur vos autres appareils.
          </div>
        )}
        {loadError && (
          <div className="error-banner" role="alert">
            <span>{loadError}</span><button className="small-button" onClick={() => void reload()}>Réessayer le chargement</button>
          </div>
        )}
        {notice && <p className={`toast ${saveState === "error" ? "toast-error" : ""}`} role="status">{notice}</p>}

        {view === "planning" ? (
          <section className="page-section" aria-labelledby="planning-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">ORGANISER SANS SE PRESSER</p>
                <h1 id="planning-title">Planning</h1>
                <p>Vos petites étapes du potager, au bon moment pour vous.</p>
              </div>
              <button className="button button-primary" disabled={editingDisabled} onClick={() => openTask()}>
                <Plus aria-hidden="true" size={18} /> Ajouter une tâche personnelle
              </button>
            </div>
            {loading ? <p className="loading-line" role="status">Chargement de votre planning…</p> : (
              <div className="planning-grid">
                <section className="calendar-card" aria-labelledby="calendar-heading">
                  <div className="section-title-row">
                    <div><p className="eyebrow">VUE D’ENSEMBLE</p><h2 id="calendar-heading">Calendrier</h2></div>
                    <div className="calendar-nav">
                      <button className="icon-button" aria-label="Mois précédent" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={19} /></button>
                      <span className="month-title" aria-live="polite">{monthLabel(month)}</span>
                      <button className="icon-button" aria-label="Mois suivant" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={19} /></button>
                    </div>
                  </div>
                  <div className="calendar-grid" role="group" aria-label={`Calendrier de ${monthLabel(month)}`}>
                    {weekdayLabels.map((weekday) => <span className="weekday" key={weekday}>{weekday}</span>)}
                    {calendarDays.map((day) => {
                      const value = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                      const inMonth = day.getMonth() === month.getMonth();
                      return (
                        <button
                          key={value}
                          type="button"
                          className={`calendar-day ${inMonth ? "" : "outside"} ${selectedDay === value ? "selected" : ""}`}
                          aria-label={`${longDate(value)}${taskDays.has(value) ? ", contient des tâches" : ""}`}
                          aria-pressed={selectedDay === value}
                          onClick={() => selectCalendarDate(value)}
                        >
                          <span>{day.getDate()}</span>
                          {taskDays.has(value) && <span className="day-dot" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="calendar-legend"><span className="legend-mark" aria-hidden="true" /> Jour avec une tâche</div>
                </section>

                <section className="task-panel" aria-labelledby="tasks-heading">
                  <div className="section-title-row task-heading">
                    <div><p className="eyebrow">À FAIRE</p><h2 id="tasks-heading">Mes tâches</h2></div>
                    <span className="task-count">{visibleTasks.length}</span>
                  </div>
                  <div className="task-filter" role="group" aria-label="Choisir les tâches affichées">
                    <button type="button" aria-pressed={taskScope === "date"} className={taskScope === "date" ? "filter-active" : ""} onClick={() => setTaskScope("date")}>Ce jour</button>
                    <button type="button" aria-pressed={taskScope === "all"} className={taskScope === "all" ? "filter-active" : ""} onClick={() => setTaskScope("all")}>Toutes les tâches</button>
                  </div>
                  <p className="selected-date">{taskScope === "date" ? longDate(selectedDay) : "Toutes les tâches, par ordre chronologique"}</p>
                  {visibleTasks.length > 0 ? (
                    <ul className="task-list">
                      {visibleTasks.map((task) => (
                        <li key={task.id}>
                          <button className="task-row" onClick={() => openTask(task)} aria-label={`Modifier ${task.kind === "suggested" ? "la tâche suggérée" : "la tâche personnelle"} : ${task.title}${taskScope === "all" ? `, le ${longDate(task.date)}` : ""}`}>
                            <span className={`task-symbol ${task.kind}`} aria-hidden="true">{task.kind === "suggested" ? <Leaf size={16} /> : <CalendarDays size={16} />}</span>
                            <span className="task-copy"><strong>{task.title}</strong><small>{task.kind === "suggested" ? "Suggérée" : "Personnelle"}{taskScope === "all" ? ` · ${new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "short" }).format(new Date(`${task.date}T12:00:00`))}` : ""}</small></span>
                            <ChevronRight size={17} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="empty-day">
                      <span className="empty-icon"><CalendarDays size={21} aria-hidden="true" /></span>
                      <h3>{taskScope === "date" ? "Aucune tâche ce jour-là" : "Aucune tâche pour le moment"}</h3>
                      <p>Ajoutez une petite étape ou enregistrez une plante pour voir des suggestions saisonnières.</p>
                      <button className="text-button" onClick={() => openTask()}><Plus size={16} /> Ajouter une tâche personnelle</button>
                      {garden.plants.length === 0 && <button className="text-button" onClick={() => setView("plan")}><Sprout size={16} /> Ajouter une plante au plan</button>}
                    </div>
                  )}
                  <div className="task-help"><span className="task-symbol suggested"><Leaf size={15} /></span><span><strong>Suggérée</strong> — repère issu d’une source locale, à adapter à votre jardin.</span></div>
                </section>
              </div>
            )}
            <section className="advice-section" aria-labelledby="advice-title">
              <div><span className="advice-icon"><CircleHelp size={20} aria-hidden="true" /></span><div><h2 id="advice-title">Des conseils, quand vous en avez besoin</h2><p>Choisissez une plante pour consulter un repère de saison et sa source.</p></div></div>
              {garden.plants.length ? (
                <div className="advice-actions">
                  {garden.plants.map((plant) => (
                    <button className="button button-secondary" key={plant.id} onClick={() => setAdviceFor(plant)}>
                      <CircleHelp size={16} aria-hidden="true" /> Conseils : {plant.name}
                    </button>
                  ))}
                </div>
              ) : <button className="button button-secondary" onClick={() => setView("plan")}>Ajouter une plante au plan</button>}
            </section>
          </section>
        ) : (
          <section className="page-section" aria-labelledby="plan-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">DESSINER SON PETIT COIN DE NATURE</p>
                <h1 id="plan-title">Plan du potager</h1>
                <p>Un croquis simple pour vous repérer, pas besoin d’être précis au centimètre.</p>
              </div>
              <button className="button button-primary" onClick={() => { setEditingArea(null); setAreaModal(true); }} disabled={Boolean(placing) || editingDisabled}>
                <Plus aria-hidden="true" size={18} /> Ajouter une zone
              </button>
            </div>
            {loading ? <p className="loading-line" role="status">Chargement de votre plan…</p> : (
              <div className="plan-layout">
                <section className="map-card" aria-label="Plan schématique du jardin">
                  <div className="map-topline"><span className="map-caption"><Map size={16} aria-hidden="true" /> CROQUIS APPROXIMATIF</span><span>Repères en mètres</span></div>
                  <div
                    className={`garden-map ${placing ? "placing" : ""}`}
                    ref={mapRef}
                    role="group"
                    aria-label="Plan du jardin, zones sélectionnables. Les dimensions sont approximatives."
                    tabIndex={0}
                    style={{ backgroundSize: `${100 / mapWidthM}% ${100 / mapHeightM}%` }}
                    onKeyDown={handleMapKey}
                    onClick={handleMapClick}
                  >
                    {garden.areas.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        className={`map-area ${selectedAreaId === area.id ? "selected" : ""} ${placing?.mode === "move" && placing.id === area.id ? "moving" : ""}`}
                        style={{
                          left: `${(area.xM / mapWidthM) * 100}%`,
                          top: `${(area.yM / mapHeightM) * 100}%`,
                          width: `${Math.max(6, (area.widthM / mapWidthM) * 100)}%`,
                          height: `${Math.max(9, (area.lengthM / mapHeightM) * 100)}%`,
                        }}
                        aria-pressed={selectedAreaId === area.id}
                        aria-label={`${area.name}, ${area.widthM} mètres par ${area.lengthM} mètres${selectedAreaId === area.id ? ", sélectionnée" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedAreaId(area.id);
                        }}
                      >
                        <span className="map-area-name">{area.name}</span>
                        <span className="map-area-size">{area.widthM} × {area.lengthM} m</span>
                      </button>
                    ))}
                    {placing && (
                      <button
                        type="button"
                        className="placement-marker"
                        style={{ left: `${(placing.xM / mapWidthM) * 100}%`, top: `${(placing.yM / mapHeightM) * 100}%` }}
                        aria-label={`${placing.mode === "move" ? "Nouvel emplacement de" : "Emplacement provisoire de"} ${placing.name}. Flèches pour déplacer, Entrée pour confirmer, Échap pour annuler.`}
                        onClick={(event) => {
                          event.stopPropagation();
                          void placeArea(placing.xM, placing.yM);
                        }}
                      >
                        <span>{placing.name}</span>
                      </button>
                    )}
                    {garden.areas.length === 0 && !placing && (
                      <div className="map-empty"><span className="empty-icon"><Sprout size={24} /></span><strong>Votre jardin commence ici</strong><span>Ajoutez une zone pour poser les premières bases.</span></div>
                    )}
                  </div>
                  {placing && <p className="placement-help" role="status" aria-live="polite">Emplacement : {placing.xM.toFixed(1)} m depuis la gauche, {placing.yM.toFixed(1)} m depuis le haut. {placing.mode === "move" ? "Déplacez la zone" : "Déplacez le repère"} avec les flèches (pas de 0,5 m), puis appuyez sur Entrée ou cliquez sur le plan. Échap annule.</p>}
                  <div className="map-footnote"><span className="map-footnote-icon"><CircleHelp size={15} /></span> Les zones sont schématiques. Leurs dimensions en mètres restent approximatives.</div>
                </section>
                <aside className="area-panel" aria-labelledby="areas-heading">
                  <div className="section-title-row"><div><p className="eyebrow">VOTRE ESPACE</p><h2 id="areas-heading">Zones du jardin</h2></div><span className="task-count">{garden.areas.length}</span></div>
                  {garden.areas.length ? (
                    <div className="area-list" role="group" aria-label="Choisir une zone">
                      {garden.areas.map((area) => (
                        <button className={`area-list-item ${selectedAreaId === area.id ? "selected" : ""}`} key={area.id} onClick={() => setSelectedAreaId(area.id)} aria-pressed={selectedAreaId === area.id}>
                          <span className="area-square" aria-hidden="true" />
                          <span><strong>{area.name}</strong><small>{area.widthM} m × {area.lengthM} m</small></span>
                          {selectedAreaId === area.id && <span className="selected-label">Sélectionnée</span>}
                        </button>
                      ))}
                    </div>
                  ) : <p className="area-empty">Aucune zone pour le moment. Ajoutez une zone pour commencer.</p>}
                  {selectedArea && (
                    <div className="area-details">
                      <div className="detail-divider" />
                      <p className="eyebrow">ZONE SÉLECTIONNÉE</p>
                      <h3>{selectedArea.name}</h3>
                      <p className="area-measure">Dimensions approximatives : {selectedArea.widthM} m × {selectedArea.lengthM} m</p>
                      <button className="text-button edit-area-button" disabled={editingDisabled} onClick={() => { setEditingArea(selectedArea); setAreaModal(true); }}>Modifier le nom ou les dimensions</button>
                      <button className="text-button edit-area-button" disabled={editingDisabled || Boolean(placing)} onClick={() => startReposition(selectedArea)}>Déplacer la zone</button>
                      <div className="plants-title"><h3>Plantes et arbres</h3><span>{areaPlants.length}</span></div>
                      {areaPlants.length ? (
                        <ul className="plant-list">
                          {areaPlants.map((plant) => <li key={plant.id}><span className="plant-bullet"><Sprout size={15} /></span><span><strong>{plant.name}</strong><small>{plant.kind === "tree" ? "Arbre" : "Plante"} · planté le {new Intl.DateTimeFormat("fr-BE").format(new Date(`${plant.plantedOn}T12:00:00`))}</small></span></li>)}
                        </ul>
                      ) : <p className="area-empty">Aucune plante enregistrée dans cette zone.</p>}
                      <button className="button button-secondary full-button" disabled={editingDisabled} onClick={() => { pendingPlantId.current = id(); setPlantModal(true); }}><Plus size={17} /> Ajouter une plante ou un arbre</button>
                    </div>
                  )}
                </aside>
              </div>
            )}
          </section>
        )}
        <footer className="page-footer">Fait pour apprendre à son rythme <span aria-hidden="true">·</span> Tournai, Belgique</footer>
      </main>

      {areaModal && (
        <Modal title={editingArea ? "Modifier la zone" : "Ajouter une zone"} onClose={() => { setAreaModal(false); setEditingArea(null); }}>
          <p className="modal-intro">{editingArea ? "Modifiez le nom ou les dimensions approximatives de cette zone." : "Choisissez un nom et des dimensions approximatives. Vous placerez ensuite la zone sur le croquis."}</p>
          <form className="stack-form" onSubmit={addArea}>
            <label htmlFor="area-name">Nom de la zone</label><input id="area-name" name="name" required defaultValue={editingArea?.name ?? ""} placeholder="Ex. Carré de légumes" />
            <div className="form-columns">
              <div><label htmlFor="area-width">Largeur (m)</label><input id="area-width" name="width" type="number" min="0.1" step="0.1" defaultValue={editingArea?.widthM ?? 2} required /></div>
              <div><label htmlFor="area-length">Longueur (m)</label><input id="area-length" name="length" type="number" min="0.1" step="0.1" defaultValue={editingArea?.lengthM ?? 3} required /></div>
            </div>
            <p className="field-hint">La forme est rectangulaire et les mesures servent de repère, pas de plan cadastral.</p>
            <div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => { setAreaModal(false); setEditingArea(null); }}>Annuler</button><button className="button button-primary" type="submit">{editingArea ? "Enregistrer la zone" : "Continuer vers le plan"}</button></div>
          </form>
        </Modal>
      )}
      {plantModal && (
        <Modal title="Ajouter une plante ou un arbre" onClose={() => { setPlantModal(false); pendingPlantId.current = null; }}>
          <p className="modal-intro">Ajoutez vos propres repères. Le nom saisi reste le vôtre ; il ne confirme pas une identification botanique.</p>
          <form className="stack-form" onSubmit={addPlant}>
            <label htmlFor="plant-name">Nom ou type</label><input id="plant-name" name="name" required placeholder="Ex. Fraisier, tomate…" />
            <label htmlFor="plant-kind">Type</label><select id="plant-kind" name="kind" defaultValue="plant"><option value="plant">Plante</option><option value="tree">Arbre</option></select>
            <label htmlFor="plant-area">Zone du plan</label>
            <select id="plant-area" name="areaId" defaultValue={selectedAreaId} required>
              {garden.areas.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}
            </select>
            <label htmlFor="plant-date">Date de plantation</label><input id="plant-date" name="plantedOn" type="date" defaultValue={isoToday()} required />
            <div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => { setPlantModal(false); pendingPlantId.current = null; }}>Annuler</button><button className="button button-primary" type="submit">{saveState === "error" ? "Réessayer l’enregistrement" : "Enregistrer la plante"}</button></div>
          </form>
        </Modal>
      )}
      {taskModal && (
        <Modal title={editingTask ? "Modifier la tâche" : "Ajouter une tâche personnelle"} onClose={() => { setTaskModal(false); setEditingTask(null); pendingTaskId.current = null; }}>
          {editingTask?.kind === "suggested" && <div className="source-callout">
            <p>Suggestion saisonnière : vos changements de titre et de date seront conservés lors de l’actualisation.</p>
            {editingTask.source && <p><strong>Source :</strong> <a href={editingTask.source.url} target="_blank" rel="noreferrer">{editingTask.source.name}</a> · revue {editingTask.source.reviewedOn} · catalogue {editingTask.source.version}. {editingTask.source.evidence} {editingTask.source.applicability} {editingTask.source.caveat}</p>}
          </div>}
          <form className="stack-form" onSubmit={submitTask}>
            <label htmlFor="task-title">Nom de la tâche</label><input id="task-title" name="title" required defaultValue={editingTask?.title ?? ""} autoFocus />
            <label htmlFor="task-date">Date</label><input id="task-date" name="date" type="date" required defaultValue={editingTask?.date ?? selectedDay} />
            <div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => { setTaskModal(false); setEditingTask(null); pendingTaskId.current = null; }}>Annuler</button><button className="button button-primary" type="submit">{saveState === "error" ? "Réessayer l’enregistrement" : editingTask ? "Enregistrer les modifications" : "Ajouter la tâche"}</button></div>
          </form>
        </Modal>
      )}
      {adviceFor && (
        <Modal title={`Conseils pour ${adviceFor.name}`} onClose={() => setAdviceFor(null)}>
          <p className="modal-intro">Repères documentés, affichés à votre demande. Ils ne remplacent pas l’observation de votre jardin.</p>
          {requestAdvice(adviceFor.name).length ? (
            <div className="advice-cards">
              {requestAdvice(adviceFor.name).map((advice: GardenAdvice) => (
                <article className="advice-card" key={advice.id}>
                  <h3>{advice.title}</h3><p>{advice.message}</p>
                  <p><strong>Contexte :</strong> {advice.applicability}</p>
                  <p><strong>Éléments de la source :</strong> {advice.evidence}</p>
                  <p className="caveat"><strong>À garder en tête :</strong> {advice.caveat}</p>
                  <a href={advice.sourceUrl} target="_blank" rel="noreferrer">Source : {advice.sourceName} <span aria-hidden="true">↗</span></a>
                  <p className="source-version">Revu le {advice.reviewedOn} · catalogue {advice.version}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="no-advice"><CircleHelp size={21} aria-hidden="true" /><p>Aucun repère local vérifié n’est encore disponible pour ce nom. Nous préférons ne pas inventer de calendrier ou de conseil.</p><a href="https://velt.nu/ecologisch-tuinieren" target="_blank" rel="noreferrer">Découvrir le jardinage écologique chez Velt <span aria-hidden="true">↗</span></a></div>
          )}
          <div className="modal-actions"><button className="button button-primary" onClick={() => setAdviceFor(null)}>Fermer</button></div>
        </Modal>
      )}
    </div>
  );
}

export default App;
