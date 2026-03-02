import "server-only";
import { db } from "../firebase.server";

export type FindMySizeProfile = {
  gender: "Men" | "Women" | "Unisex";
  age: number;
  height: number;
  weight: number;
  bodyType: "Slim" | "Regular" | "Broad";
  fit: "Relaxed" | "Standard" | "Fitted";
};

export type LengthGuideFilters = {
  gender: "Men" | "Women";
  height: "160-165" | "166-170" | "171-175" | "176-180";
  category: "Shirts" | "Trousers" | "Sets";
  modelId?: string;
};

export type SizeToolEventInput = {
  tool: "find_my_size" | "length_guide";
  sessionId: string;
  userId?: string;
  profile?: FindMySizeProfile;
  filters?: LengthGuideFilters;
  recommendedSize?: string;
  selectedSize?: string;
  metadata?: Record<string, unknown>;
};

export type SizeSuggestion = {
  suggestedSize: string | null;
  confidence: number;
  sampleSize: number;
};

type SizeToolEventDoc = SizeToolEventInput & {
  createdAt: string;
};

const collectionName = "size_tool_events";

function scoreSuggestion(candidates: string[]): SizeSuggestion {
  if (!candidates.length) {
    return { suggestedSize: null, confidence: 0, sampleSize: 0 };
  }

  const counts = new Map<string, number>();
  for (const size of candidates) {
    const normalized = String(size || "").trim().toUpperCase();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }

  if (counts.size === 0) {
    return { suggestedSize: null, confidence: 0, sampleSize: 0 };
  }

  let bestSize: string | null = null;
  let bestCount = 0;
  counts.forEach((count, size) => {
    if (count > bestCount) {
      bestSize = size;
      bestCount = count;
    }
  });

  const sampleSize = [...counts.values()].reduce((sum, value) => sum + value, 0);
  const confidence = sampleSize ? Math.round((bestCount / sampleSize) * 100) : 0;

  return {
    suggestedSize: bestSize,
    confidence,
    sampleSize,
  };
}

function numeric(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value;
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefined(item))
      .filter((item) => item !== undefined) as T;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, stripUndefined(v)] as const);
    return Object.fromEntries(entries) as T;
  }

  return value;
}

export async function recordSizeToolEvent(input: SizeToolEventInput): Promise<SizeToolEventDoc> {
  const docRef = db.collection(collectionName).doc();
  const payload = stripUndefined<SizeToolEventDoc>({
    ...input,
    createdAt: new Date().toISOString(),
  });
  await docRef.set(payload);
  return payload;
}

export async function getFindMySizeSuggestion(profile: FindMySizeProfile): Promise<SizeSuggestion> {
  const snap = await db
    .collection(collectionName)
    .where("tool", "==", "find_my_size")
    .limit(400)
    .get();

  const matches: string[] = [];
  for (const doc of snap.docs) {
    const event = doc.data() as SizeToolEventDoc;
    const eventProfile = event.profile;
    if (!eventProfile) continue;

    const eventHeight = numeric(eventProfile.height);
    const eventWeight = numeric(eventProfile.weight);
    if (eventHeight === null || eventWeight === null) continue;

    const sameGender = eventProfile.gender === profile.gender;
    const sameBodyType = eventProfile.bodyType === profile.bodyType;
    const sameFit = eventProfile.fit === profile.fit;
    const nearHeight = Math.abs(eventHeight - profile.height) <= 8;
    const nearWeight = Math.abs(eventWeight - profile.weight) <= 8;

    if (!sameGender || !sameBodyType || !sameFit || !nearHeight || !nearWeight) continue;

    const candidate = event.selectedSize || event.recommendedSize;
    if (candidate) matches.push(candidate);
  }

  return scoreSuggestion(matches);
}

export async function getLengthGuideSuggestion(filters: LengthGuideFilters): Promise<SizeSuggestion> {
  const snap = await db
    .collection(collectionName)
    .where("tool", "==", "length_guide")
    .limit(400)
    .get();

  const matches: string[] = [];
  for (const doc of snap.docs) {
    const event = doc.data() as SizeToolEventDoc;
    const eventFilters = event.filters;
    if (!eventFilters) continue;

    if (eventFilters.gender !== filters.gender) continue;
    if (eventFilters.height !== filters.height) continue;
    if (eventFilters.category !== filters.category) continue;

    const candidate = event.selectedSize || event.recommendedSize;
    if (candidate) matches.push(candidate);
  }

  return scoreSuggestion(matches);
}
