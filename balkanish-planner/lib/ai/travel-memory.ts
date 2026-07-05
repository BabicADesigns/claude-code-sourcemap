import {
  MEMORY_SIGNAL_SOURCE_WEIGHTS,
  PROTECTED_MEMORY_SOURCES,
  type MemoryStrengthLabel,
  type TravelMemorySignal,
  type TravelMemorySummary,
} from "@/lib/types";

const DECAY_THRESHOLD_MS = 18 * 30 * 24 * 60 * 60 * 1000; // ~18 months

/** strength = min(1.0, base_weight + repetition_bonus); repetition_bonus = min(0.3, (count-1) * 0.1) */
export function computeSignalStrength(
  source: TravelMemorySignal["source"],
  occurrenceCount: number
): number {
  const base = MEMORY_SIGNAL_SOURCE_WEIGHTS[source] ?? 0.3;
  const bonus = Math.min(0.3, (occurrenceCount - 1) * 0.1);
  return Math.min(1.0, base + bonus);
}

/** confidence = min(1.0, strength + confirmation_boost) */
export function computeSignalConfidence(
  source: TravelMemorySignal["source"],
  occurrenceCount: number,
  status: TravelMemorySignal["confirmation_status"]
): number {
  const strength = computeSignalStrength(source, occurrenceCount);
  const boost = status === "CONFIRMED" ? 0.3 : 0;
  return Math.min(1.0, strength + boost);
}

/**
 * Returns true when the signal is stale and should be excluded from AI briefs.
 * Protected sources (PROFILE_CONFIRMATION, DIRECT_MEMORY_CONFIRMATION) and
 * CONFIRMED signals never decay.
 */
export function isSignalDecayed(signal: TravelMemorySignal): boolean {
  if (PROTECTED_MEMORY_SOURCES.has(signal.source)) return false;
  if (signal.confirmation_status === "CONFIRMED") return false;
  const age = Date.now() - new Date(signal.last_observed_at).getTime();
  return age > DECAY_THRESHOLD_MS;
}

export function getStrengthLabel(signal: TravelMemorySignal): MemoryStrengthLabel {
  if (signal.strength >= 0.7) return "strong_pattern";
  if (signal.strength >= 0.45) return "noticed";
  return "still_learning";
}

export function buildMemorySummary(signals: TravelMemorySignal[]): TravelMemorySummary {
  const active = signals.filter((s) => s.active && s.confirmation_status !== "REJECTED");
  const confirmed = active.filter((s) => s.confirmation_status === "CONFIRMED");
  const unconfirmed = active.filter((s) => s.confirmation_status === "UNCONFIRMED");
  const strong = unconfirmed.filter((s) => getStrengthLabel(s) === "strong_pattern");
  const noticed = unconfirmed.filter((s) => getStrengthLabel(s) === "noticed");
  const learning = unconfirmed.filter((s) => getStrengthLabel(s) === "still_learning");
  return { confirmed, strong, noticed, learning, total: active.length };
}

/**
 * Builds the `trip_memory` block injected into the AI grounding brief.
 * Returns null when there are no meaningful signals to share.
 * Excludes decayed, rejected, and still-learning signals — only confirmed
 * and strong unconfirmed signals reach the AI.
 */
export function buildMemoryBriefBlock(signals: TravelMemorySignal[]): string | null {
  const relevant = signals.filter(
    (s) =>
      s.active &&
      s.confirmation_status !== "REJECTED" &&
      !isSignalDecayed(s) &&
      (s.confirmation_status === "CONFIRMED" || getStrengthLabel(s) !== "still_learning")
  );
  if (relevant.length === 0) return null;

  const lines: string[] = [];
  for (const sig of relevant) {
    const dir = sig.direction === "NEGATIVE" ? "avoids" : "enjoys";
    const conf = sig.confirmation_status === "CONFIRMED" ? " (confirmed preference)" : "";
    lines.push(`- Traveller ${dir} ${sig.subject}${sig.value ? ` (${sig.value})` : ""}${conf}`);
  }
  return lines.join("\n");
}
