import "server-only";
import { db } from "../firebase.server";
import type { CurrencyRate } from "../../src/types/catalog";

const collectionName = "rates";
const defaultDocId = "usd-tzs";
const configDocId = "__config";

const toPairId = (rate: CurrencyRate) =>
  (rate.pairId || `${rate.base}-${rate.target}`).toLowerCase();

export type RatesConfig = {
  defaultCurrency?: string;
};

export async function getRate(pairId = defaultDocId): Promise<CurrencyRate | null> {
  const snap = await db.collection(collectionName).doc(pairId).get();
  if (!snap.exists) return null;
  const data = snap.data() as CurrencyRate;
  return { ...data, pairId: snap.id };
}

export async function listRates(): Promise<CurrencyRate[]> {
  const snap = await db.collection(collectionName).get();
  return snap.docs.map((doc) => ({ ...(doc.data() as CurrencyRate), pairId: doc.id }));
}

export async function upsertRate(rate: CurrencyRate) {
  const payload: CurrencyRate = {
    ...rate,
    updatedAt: rate.updatedAt || new Date().toISOString(),
  };
  const id = toPairId(payload);
  await db.collection(collectionName).doc(id).set(payload, { merge: true });
  return { ...payload, pairId: id };
}

export async function deleteRate(pairId: string) {
  await db.collection(collectionName).doc(pairId).delete();
}

export async function getRatesConfig(): Promise<RatesConfig | null> {
  const snap = await db.collection(collectionName).doc(configDocId).get();
  if (!snap.exists) return null;
  return snap.data() as RatesConfig;
}

export async function setRatesConfig(config: RatesConfig) {
  await db.collection(collectionName).doc(configDocId).set(config, { merge: true });
  return config;
}
