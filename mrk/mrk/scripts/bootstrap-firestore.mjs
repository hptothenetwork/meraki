import nextEnv from "@next/env"
import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(
        clientEmail && privateKey
          ? {
              credential: cert({
                projectId,
                clientEmail,
                privateKey,
              }),
            }
          : {
              credential: applicationDefault(),
              projectId,
            },
      )

const db = getFirestore(app)

const categories = [
  { id: "savannah", name: "Savannah", description: "Signature Savannah edits." },
  { id: "kaftans", name: "Kaftans", description: "Everyday and occasion kaftans." },
  { id: "boubous", name: "Boubous", description: "Classic and modern boubou silhouettes." },
  { id: "two-piece", name: "Two-Piece Sets", description: "Coordinated matching sets." },
]

const products = [
  {
    id: "savannah-kaftan-red",
    name: "Savannah Kaftan - Red Print",
    category: "savannah",
    priceUsd: 75,
    priceTzs: 185000,
    stockStatus: "in_stock",
    media: [{ src: "/images/product-kaftan-red.jpg", alt: "Savannah Kaftan - Red Print", type: "image" }],
    sizeGuide: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "indigo-night-kaftan",
    name: "Indigo Night Kaftan",
    category: "kaftans",
    priceUsd: 79,
    priceTzs: 195000,
    stockStatus: "in_stock",
    media: [{ src: "/images/product-kaftan-navy.jpg", alt: "Indigo Night Kaftan", type: "image" }],
    sizeGuide: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "emerald-baroque-kaftan",
    name: "Emerald Baroque Kaftan",
    category: "kaftans",
    priceUsd: 71,
    priceTzs: 175000,
    stockStatus: "in_stock",
    media: [{ src: "/images/product-kaftan-green.jpg", alt: "Emerald Baroque Kaftan", type: "image" }],
    sizeGuide: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "ocean-bloom-kaftan",
    name: "Ocean Bloom Kaftan",
    category: "boubous",
    priceUsd: 75,
    priceTzs: 185000,
    stockStatus: "in_stock",
    media: [{ src: "/images/product-kaftan-blue.jpg", alt: "Ocean Bloom Kaftan", type: "image" }],
    sizeGuide: ["S", "M", "L", "XL", "XXL"],
  },
]

const siteSettings = {
  quickShop: {
    enabled: true,
    productIds: products.slice(0, 4).map((p) => p.id),
  },
  partners: [
    { name: "Meraki Studio", logo: "/logo/logo.svg", website: "https://www.instagram.com/" },
    { name: "Editorial Partner", logo: "/images/placeholder-logo.png", website: "https://example.com" },
  ],
  sectionVisibility: {
    hero: true,
    quickShop: true,
    aboutMubah: true,
    partners: true,
    newsletter: true,
  },
}

async function run() {
  if (!projectId) {
    throw new Error("Missing FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID) in env.")
  }

  const batch = db.batch()

  for (const category of categories) {
    const ref = db.collection("categories").doc(category.id)
    batch.set(
      ref,
      {
        ...category,
        createdAt: new Date().toISOString(),
      },
      { merge: true },
    )
  }

  for (const product of products) {
    const ref = db.collection("products").doc(product.id)
    batch.set(ref, product, { merge: true })
  }

  const settingsRef = db.collection("siteSettings").doc("default")
  batch.set(settingsRef, siteSettings, { merge: true })

  await batch.commit()
  console.log("Firestore bootstrap complete: categories, products, siteSettings/default")
  console.log("Indexes file present at: firestore.indexes.json")
  console.log("Deploy indexes with: npm run firestore:indexes:deploy")
}

run().catch((error) => {
  console.error("Firestore bootstrap failed.")
  console.error(error?.message || error)
  process.exit(1)
})
