import { guardPage, getFriendlyErrorMessage } from "./portal-client";

export const TEACHER_ONBOARDING_STORAGE_KEY = "flybridge_teacher_onboarding_v1";

export type TeacherOnboardingStepId =
  | "receive-credentials"
  | "sign-into-purelymail"
  | "create-google-account"
  | "verify-email"
  | "complete-phone-verification"
  | "join-flybridge-classroom";

export interface TeacherOnboardingCompletion {
  completed: boolean;
  completedAt: string | null;
}

export interface TeacherOnboardingState {
  version: 1;
  steps: Record<TeacherOnboardingStepId, TeacherOnboardingCompletion>;
  updatedAt: string | null;
}

export interface TeacherOnboardingStepDefinition {
  id: TeacherOnboardingStepId;
  number: number;
  title: string;
  estimate: string;
}

export interface TeacherOnboardingSummary {
  completedCount: number;
  totalCount: number;
  percentage: number;
  allComplete: boolean;
}

export const teacherOnboardingSteps: TeacherOnboardingStepDefinition[] = [
  { id: "receive-credentials", number: 1, title: "Receive your FlyBridge credentials", estimate: "1 minute" },
  { id: "sign-into-purelymail", number: 2, title: "Sign into Purelymail", estimate: "2 minutes" },
  { id: "create-google-account", number: 3, title: "Create your Google Account", estimate: "3–5 minutes" },
  { id: "verify-email", number: 4, title: "Verify your email", estimate: "2 minutes" },
  { id: "complete-phone-verification", number: 5, title: "Complete phone verification if requested", estimate: "1–2 minutes" },
  { id: "join-flybridge-classroom", number: 6, title: "Join FlyBridge Classroom", estimate: "2 minutes" }
] as const;

function createStepCompletion(): TeacherOnboardingCompletion {
  return {
    completed: false,
    completedAt: null
  };
}

export function createDefaultTeacherOnboardingState(): TeacherOnboardingState {
  return {
    version: 1,
    steps: {
      "receive-credentials": createStepCompletion(),
      "sign-into-purelymail": createStepCompletion(),
      "create-google-account": createStepCompletion(),
      "verify-email": createStepCompletion(),
      "complete-phone-verification": createStepCompletion(),
      "join-flybridge-classroom": createStepCompletion()
    },
    updatedAt: null
  };
}

function supportsLocalStorage() {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return false;
    const probe = "__flybridge_onboarding_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function normaliseCompletion(value: unknown): TeacherOnboardingCompletion {
  const completed = typeof value === "object" && value !== null && "completed" in value ? Boolean(value.completed) : false;
  const completedAt =
    typeof value === "object" && value !== null && "completedAt" in value && typeof value.completedAt === "string" && value.completedAt.trim()
      ? value.completedAt
      : null;

  return {
    completed,
    completedAt: completed ? completedAt ?? new Date().toISOString() : null
  };
}

function sanitiseTeacherOnboardingState(value: unknown): TeacherOnboardingState {
  const fallback = createDefaultTeacherOnboardingState();
  if (!value || typeof value !== "object") return fallback;

  const source = value as { version?: unknown; steps?: Record<string, unknown>; updatedAt?: unknown };
  const steps = teacherOnboardingSteps.reduce(
    (accumulator, step) => {
      accumulator[step.id] = normaliseCompletion(source.steps?.[step.id]);
      return accumulator;
    },
    {} as Record<TeacherOnboardingStepId, TeacherOnboardingCompletion>
  );

  return {
    version: 1,
    steps,
    updatedAt: typeof source.updatedAt === "string" && source.updatedAt.trim() ? source.updatedAt : null
  };
}

export function loadOnboardingState(): TeacherOnboardingState {
  const fallback = createDefaultTeacherOnboardingState();
  if (!supportsLocalStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(TEACHER_ONBOARDING_STORAGE_KEY);
    if (!raw) return fallback;
    return sanitiseTeacherOnboardingState(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

function persistOnboardingState(state: TeacherOnboardingState) {
  if (!supportsLocalStorage()) return;

  try {
    window.localStorage.setItem(TEACHER_ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures so the UI still works when storage is blocked.
  }
}

export function updateOnboardingStep(stepId: TeacherOnboardingStepId, completed: boolean, existingState = loadOnboardingState()) {
  const nextState: TeacherOnboardingState = {
    ...existingState,
    steps: {
      ...existingState.steps,
      [stepId]: {
        completed,
        completedAt: completed ? new Date().toISOString() : null
      }
    },
    updatedAt: new Date().toISOString()
  };

  persistOnboardingState(nextState);
  return nextState;
}

export function resetOnboardingState() {
  const nextState = createDefaultTeacherOnboardingState();
  persistOnboardingState(nextState);
  return nextState;
}

export function getOnboardingSummary(state: TeacherOnboardingState): TeacherOnboardingSummary {
  const completedCount = teacherOnboardingSteps.filter((step) => state.steps[step.id]?.completed).length;
  const totalCount = teacherOnboardingSteps.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    completedCount,
    totalCount,
    percentage,
    allComplete: completedCount === totalCount
  };
}

export function getInitialOpenStepId(state: TeacherOnboardingState) {
  const firstIncomplete = teacherOnboardingSteps.find((step) => !state.steps[step.id]?.completed);
  return firstIncomplete?.id ?? teacherOnboardingSteps[0]?.id ?? null;
}

function updateStepUI(state: TeacherOnboardingState) {
  teacherOnboardingSteps.forEach((step) => {
    const completed = Boolean(state.steps[step.id]?.completed);
    const card = document.querySelector<HTMLElement>(`[data-onboarding-card="${step.id}"]`);
    const details = card?.querySelector<HTMLDetailsElement>("details");
    const summary = details?.querySelector<HTMLElement>("summary");
    const status = card?.querySelector<HTMLElement>("[data-step-status]");
    const indicator = card?.querySelector<HTMLElement>("[data-step-indicator]");
    const button = card?.querySelector<HTMLButtonElement>("[data-complete-toggle]");

    if (card) card.dataset.completed = String(completed);
    if (details) details.dataset.completed = String(completed);
    if (summary) summary.setAttribute("aria-expanded", String(details?.open ?? false));

    if (status) {
      status.textContent = completed ? "Complete" : "Mark as complete";
      status.dataset.state = completed ? "complete" : "pending";
    }

    if (indicator) {
      indicator.textContent = completed ? "Complete" : `Step ${step.number}`;
      indicator.dataset.state = completed ? "complete" : "pending";
    }

    if (button) {
      button.dataset.completed = String(completed);
      button.textContent = completed ? "Complete" : "Mark as complete";
      button.setAttribute("aria-pressed", String(completed));
      button.setAttribute("aria-label", completed ? `Mark ${step.title} as incomplete` : `Mark ${step.title} as complete`);
    }
  });
}

function updateSummaryUI(state: TeacherOnboardingState) {
  const summary = getOnboardingSummary(state);
  const progress = document.querySelector<HTMLProgressElement>("[data-onboarding-progress]");
  const count = document.querySelector<HTMLElement>("[data-onboarding-count]");
  const percentage = document.querySelector<HTMLElement>("[data-onboarding-percentage]");
  const status = document.querySelector<HTMLElement>("[data-onboarding-progress-status]");
  const success = document.querySelector<HTMLElement>("[data-onboarding-success]");

  if (progress) {
    progress.max = summary.totalCount;
    progress.value = summary.completedCount;
    progress.setAttribute("aria-valuetext", `${summary.completedCount} of ${summary.totalCount} steps complete`);
  }
  if (count) count.textContent = `${summary.completedCount} / ${summary.totalCount} complete`;
  if (percentage) percentage.textContent = `${summary.percentage}%`;
  if (status) status.textContent = `${summary.completedCount} of ${summary.totalCount} setup steps complete.`;
  if (success) success.classList.toggle("hidden", !summary.allComplete);
}

function applyInitialExpansion(state: TeacherOnboardingState) {
  const initialOpenId = getInitialOpenStepId(state);
  document.querySelectorAll<HTMLDetailsElement>("[data-onboarding-details]").forEach((details) => {
    const shouldOpen = details.dataset.stepId === initialOpenId;
    details.open = shouldOpen;
    const summary = details.querySelector<HTMLElement>("summary");
    if (summary) summary.setAttribute("aria-expanded", String(shouldOpen));
  });
}

export async function bootstrapTeacherOnboarding() {
  await guardPage(["tutor", "admin"], {
    adminRedirectHome: "/admin",
    adminRedirectMessage: "This account uses the FlyBridge admin workspace. Admin users may still review teacher onboarding here.",
    unauthorizedMessage: "Your account is signed in, but this onboarding guide is available only to FlyBridge teachers and admins."
  });

  let state = loadOnboardingState();
  applyInitialExpansion(state);
  updateStepUI(state);
  updateSummaryUI(state);

  document.querySelectorAll<HTMLDetailsElement>("[data-onboarding-details]").forEach((details) => {
    const summary = details.querySelector<HTMLElement>("summary");
    details.addEventListener("toggle", () => {
      if (summary) summary.setAttribute("aria-expanded", String(details.open));
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-complete-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const stepId = button.dataset.stepId as TeacherOnboardingStepId | undefined;
      if (!stepId) return;
      const isCompleted = state.steps[stepId]?.completed ?? false;
      state = updateOnboardingStep(stepId, !isCompleted, state);
      updateStepUI(state);
      updateSummaryUI(state);
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-reset-onboarding]").forEach((button) => {
    button.addEventListener("click", () => {
      state = resetOnboardingState();
      applyInitialExpansion(state);
      updateStepUI(state);
      updateSummaryUI(state);
    });
  });
}

export async function handleTeacherOnboardingError(error: unknown) {
  const target = document.querySelector("[data-role-error-message]");
  if (target instanceof HTMLElement) {
    target.textContent = await getFriendlyErrorMessage(error, "Teacher onboarding failed to load.");
  }
}

// TODO: Replace local storage persistence with Supabase onboarding records once the teacher onboarding table is available.
