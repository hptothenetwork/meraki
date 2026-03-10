"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { SiteAssets as CatalogSiteAssets } from "@/types/catalog";
import ImageEditor, { type ImageSettings } from "@/components/ImageEditor";
import CustomSelect from "@/components/CustomSelect";

type ProductMedia = { id?: string; src: string; alt?: string; type?: "image" | "video" };
type AdminProduct = {
  id: string;
  name: string;
  category: string;
  subtitle?: string;
  description?: string;
  priceUsd: number;
  priceTzs?: number;
  stock?: number;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock" | "preorder";
  status?: "new" | "featured" | "hidden";
  badge?: string;
  fit?: string;
  fabric?: string;
  shipping?: string;
  features?: string[];
  care?: string[];
  sizeGuide?: string[];
  hasSizeVariants?: boolean;
  quickInfo?: { label: string; value: string }[];
  media?: ProductMedia[];
  saleActive?: boolean;
  saleType?: "clearance" | "blackfriday" | "holiday" | "flash" | "seasonal" | "";
  saleLabel?: string;
  salePriceUsd?: number;
  salePriceTzs?: number;
  saleEndsAt?: string;
  fallbackImage?: string;
  fbt?: { id?: string; name: string; priceUsd: number; image: string }[];
  styleWith?: { id?: string; name: string; priceUsd: number; image: string }[];
  alsoPicked?: { id?: string; name: string; priceUsd: number; image: string }[];
  productReviews?: { author: string; rating: number; text: string; media?: { url: string; type: "image" | "video" }[]; verified?: boolean; createdAt?: string }[];
  measurementImages?: string[];
  showHeightGuide?: boolean;
  showFbt?: boolean;
  showStyleWith?: boolean;
  showAlsoPicked?: boolean;
  showDescription?: boolean;
  showFabricCare?: boolean;
  showFitSize?: boolean;
  showShippingReturns?: boolean;
  showSustainability?: boolean;
  showGarmentMeasurements?: boolean;
  showBodyMeasurements?: boolean;
  sizeAlgorithm?: {
    fitType?: "relaxed" | "regular" | "slim";
    chestMeasurements?: Record<string, number>;
    waistMeasurements?: Record<string, number>;
    lengthMeasurements?: Record<string, number>;
    recommendationText?: string;
  };
};
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
type CartItem = {
  id: string;
  name: string;
  priceUsd: number;
  priceTzs?: number;
  image?: string;
  quantity: number;
  size?: string;
};
type Order = { 
  id: string; 
  status: OrderStatus; 
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paymentProvider?: string;
  transactionId?: string;
  total: number; 
  currency: string; 
  createdAt: string; 
  updatedAt?: string;
  processingAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  paidAt?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  contact?: { name?: string; email?: string; phone?: string };
  items?: CartItem[];
  subtotal?: number;
  shipping?: number;
};
type Category = { id: string; name: string; description?: string; cover?: string; covers?: string[]; productCount?: number };
type MediaItem = { id: string; url: string; type: "image" | "video"; name: string; usedIn?: string[]; sizeMb?: number };
type RateEntry = { base: string; target: string; rate: number; pairId?: string; updatedAt?: string; source?: string };
type FormSubmission = {
  id: string;
  summary?: string;
  createdAt?: string;
  channel?: string;
  type?: string;
  status?: string;
  note?: string;
  [key: string]: string | undefined;
};
type SiteAssets = CatalogSiteAssets;
type Event = {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  date: string;
  endDate?: string;
  location: string;
  image?: string;
  posterImage?: string;
  media?: { url: string; type: "image" | "video" }[];
  link?: string;
  status: "upcoming" | "ongoing" | "past" | "draft" | "deleted";
  featured?: boolean;
  createdAt?: string;
  deletedAt?: string;
};
type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  media?: { url: string; type: "image" | "video" }[];
  author?: string;
  tags?: string[];
  status: "draft" | "published" | "deleted";
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};
type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  product?: string;
  media?: { url: string; type: "image" | "video" }[];
  verified?: boolean;
  featured?: boolean;
  status: "pending" | "approved" | "hidden" | "deleted";
  createdAt?: string;
  deletedAt?: string;
};
type GiftCardRecord = {
  code: string;
  kind?: "gift_card" | "discount_code";
  balance: number;
  originalAmount: number;
  discountType?: "amount" | "percent";
  discountByCurrency?: Record<string, number>;
  expiryDate?: string;
  createdAt: string;
  updatedAt?: string;
  status: "active" | "disabled" | "redeemed";
  recipientEmail?: string;
  recipientUserId?: string;
  recipientName?: string;
  senderName?: string;
  note?: string;
};
type GiftCardRequestRecord = {
  id: string;
  amount: number;
  currency: string;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderEmail: string;
  message?: string;
  deliveryDate?: string;
  status: "pending" | "approved" | "cancelled";
  issuedGiftCardCode?: string;
  createdAt: string;
  updatedAt?: string;
};
type Partner = {
  name: string;
  logo: string;
  website?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
};

const orangeBtn =
  "rounded-full bg-mubah-orange px-4 py-2.5 text-sm font-semibold text-mubah-deep shadow-sm hover:bg-mubah-orange-alt transition active:scale-95 min-h-[44px] touch-manipulation";
const ghostBtn = "rounded-full border border-mubah-mid px-4 py-2.5 text-sm text-mubah-cream hover:border-mubah-orange transition active:scale-95 min-h-[44px] touch-manipulation";
const inputCls = "w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 text-sm text-mubah-cream";
const orderStatusOptions: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
const MAX_UPLOAD_FILES = 10;
const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/meraki_the_brand/";
const CODE_CURRENCIES = ["TZS", "USD"] as const;

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [activeSection, setActiveSection] = useState<"dashboard" | "categories" | "products" | "media" | "orders" | "forms" | "settings" | "currency" | "events" | "blog" | "reviews" | "partners" | "quickshop" | "storefrontControls" | "signatureCuts" | "instagramFeed" | "editorialCustomers" | "password" | "trash" | "users" | "giftCards">("products");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productMediaCarouselIndex, setProductMediaCarouselIndex] = useState(0);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryReorderSelection, setCategoryReorderSelection] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video">("all");
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaProductFilter] = useState<string>("all");
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [message, setMessage] = useState("");
  const [rates, setRates] = useState<RateEntry>({ base: "USD", target: "TZS", rate: 2600, pairId: "usd-tzs" });
  const [ratesList, setRatesList] = useState<RateEntry[]>([]);
  const [rateForm, setRateForm] = useState<RateEntry>({ base: "USD", target: "", rate: 1 });
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<"basics" | "story" | "size" | "media" | "visibility" | "relations">("basics");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [defaultCurrency, setDefaultCurrency] = useState<string>("USD");
  const [pendingDefaultCurrency, setPendingDefaultCurrency] = useState<string | null>(null);
  const [lastSaved] = useState<string>("Not saved yet");
  const [formErrors] = useState<{ product?: string[]; category?: string[]; rate?: string[] }>({});
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [siteAssets, setSiteAssets] = useState<SiteAssets>({});
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [imageEditorSrc] = useState("");
  const [imageEditorAssetKey] = useState("");
  const [imageEditorCallback] = useState<((settings: ImageSettings) => void) | null>(null);
  const [reorderSelection, setReorderSelection] = useState<{ type: string; index: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sectionAssetInputRef = useRef<HTMLInputElement | null>(null);
  const sectionAssetUploadResolver = useRef<((url: string) => void) | null>(null);
  const sectionAssetMultiUploadResolver = useRef<((urls: string[]) => void) | null>(null);
  const categoriesLoadedFromDb = useRef(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordChanging, setPasswordChanging] = useState(false);
  // New sections: Events, Reviews, Partners
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartner, setNewPartner] = useState<Partner>({ name: "", logo: "", website: "", size: "medium" });

  useEffect(() => {
    const mediaCount = editingProduct?.media?.length || 0;
    if (mediaCount === 0) {
      if (productMediaCarouselIndex !== 0) setProductMediaCarouselIndex(0);
      return;
    }
    if (productMediaCarouselIndex > mediaCount - 1) {
      setProductMediaCarouselIndex(mediaCount - 1);
    }
  }, [editingProduct, productMediaCarouselIndex]);
  
  // Analytics state
  type AnalyticsEvent = {
    id: string;
    event: string;
    data?: any;
    timestamp: string;
    userAgent?: string;
    referrer?: string;
    url?: string;
  };
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDateRange, setAnalyticsDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [analyticsEventFilter, setAnalyticsEventFilter] = useState<string>('all');
  type SizeToolAnalytics = {
    summary?: {
      totalEvents?: number;
      totalFindMySize?: number;
      totalLengthGuide?: number;
      uniqueSessions?: number;
      uniqueUsers?: number;
      recommendationAcceptanceRate?: number;
    };
    topRecommendedSizes?: Array<{ label: string; count: number }>;
    topSelectedSizes?: Array<{ label: string; count: number }>;
    trends?: Array<{ day: string; total: number; findMySize: number; lengthGuide: number }>;
    conversionImpact?: {
      totalOrders?: number;
      sizeToolOrderCount?: number;
      sizeToolOrderRate?: number;
      avgOrderValueWithSizeTool?: number;
      avgOrderValueWithoutSizeTool?: number;
    };
  };
  const [sizeToolAnalytics, setSizeToolAnalytics] = useState<SizeToolAnalytics | null>(null);
  const [sizeToolAnalyticsLoading, setSizeToolAnalyticsLoading] = useState(false);
  
  // Signature Cuts management state
  type SignatureCut = { id: string; title: string; slug: string; copy: string; image: string; order?: number };
  const [newSignatureCut, setNewSignatureCut] = useState<Partial<SignatureCut>>({ title: "", slug: "", copy: "", image: "", order: 0 });
  
  // Instagram Feed management state
  type InstagramPhoto = { id: string; imageUrl: string; caption?: string; link?: string; order?: number };
  const [newInstagramPhoto, setNewInstagramPhoto] = useState<Partial<InstagramPhoto>>({ imageUrl: "", caption: "", link: INSTAGRAM_PROFILE_URL, order: 0 });
  
  // Editorial Customers management state
  type EditorialPhoto = { id: string; imageUrl: string; caption?: string; span?: string; height?: number; offset?: string; order?: number };
  const [newEditorialPhoto, setNewEditorialPhoto] = useState<Partial<EditorialPhoto>>({ imageUrl: "", caption: "", span: "col-span-4", height: 360, offset: "", order: 0 });
  
  // Users management state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [giftCards, setGiftCards] = useState<GiftCardRecord[]>([]);
  const [giftCardRequests, setGiftCardRequests] = useState<GiftCardRequestRecord[]>([]);
  const [giftCardsLoading, setGiftCardsLoading] = useState(false);
  const [giftCardForm, setGiftCardForm] = useState({
    kind: "discount_code" as "gift_card" | "discount_code",
    code: "",
    amount: "100",
    discountType: "amount" as "amount" | "percent",
    discountByCurrency: {
      TZS: "",
      USD: "",
    } as Record<(typeof CODE_CURRENCIES)[number], string>,
    expiryDate: "",
    recipientName: "",
    recipientEmail: "",
    senderName: "",
    note: "",
  });
  
  const [checkingSession, setCheckingSession] = useState(true);
  // Recycle bin state
  const [deletedEvents, setDeletedEvents] = useState<Event[]>([]);
  const [deletedPosts, setDeletedPosts] = useState<BlogPost[]>([]);
  const [deletedReviews, setDeletedReviews] = useState<Review[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);

  // Get stored admin token from localStorage (used for admin API requests)
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : '';

  const logoutAdmin = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore network issues; clear local state anyway
    }
    localStorage.removeItem("adminToken");
    setAuthed(false);
  }, []);

  // Check if user is already logged in via session cookie on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Try to fetch admin settings - if it succeeds, the session is valid
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          setAuthed(true);
        }
      } catch {
        // Session not valid, stay on login page
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/admin/products", {
      headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
    });
    if (res.ok) {
      const data = (await res.json()) as { items: AdminProduct[] };
      setProducts(data.items || []);
    }
  }, [storedToken]);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders", {
      headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
    });
    if (res.ok) {
      const data = (await res.json()) as { orders: Order[] };
      setOrders(data.orders || []);
    }
  }, [storedToken]);

  const loadRates = useCallback(async () => {
    const res = await fetch("/api/admin/rates", {
      headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
    });
    if (res.ok) {
      const data = (await res.json()) as { rates?: RateEntry[]; rate?: RateEntry; defaultCurrency?: string };
      if (data.rates) setRatesList(data.rates);
      const primary = data.rates?.find((r) => (r.pairId || `${r.base}-${r.target}`).toLowerCase() === "usd-tzs") || data.rate || data.rates?.[0];
      if (primary) setRates(primary);
      if (data.defaultCurrency) setDefaultCurrency(data.defaultCurrency.toUpperCase());
    }
  }, [storedToken]);

  const startEditRate = useCallback((rate: RateEntry) => {
    const id = (rate.pairId || `${rate.base}-${rate.target}`).toLowerCase();
    setEditingRateId(id);
    setRateForm({
      base: rate.base || "USD",
      target: rate.target || "TZS",
      rate: Number(rate.rate || 0),
      pairId: id,
      source: rate.source || "manual",
      updatedAt: rate.updatedAt,
    });
  }, []);

  const resetRateForm = useCallback(() => {
    setEditingRateId(null);
    setRateForm({ base: "USD", target: "", rate: 1 });
  }, []);

  const saveRateForm = useCallback(async () => {
    if (!rateForm.base?.trim() || !rateForm.target?.trim() || !(Number(rateForm.rate) > 0)) {
      setMessage("Enter base, target and a valid rate");
      return;
    }

    const res = await fetch("/api/admin/rates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(storedToken ? { "x-admin-token": storedToken } : {}),
      },
      body: JSON.stringify({
        base: rateForm.base.trim().toUpperCase(),
        target: rateForm.target.trim().toUpperCase(),
        rate: Number(rateForm.rate),
        source: rateForm.source || "manual",
      }),
    });

    if (!res.ok) {
      setMessage("Failed to save currency rate");
      return;
    }

    const data = (await res.json()) as { rates?: RateEntry[]; rate?: RateEntry; defaultCurrency?: string };
    if (data.rates) setRatesList(data.rates);
    if (data.rate) setRates(data.rate);
    if (data.defaultCurrency) setDefaultCurrency(data.defaultCurrency.toUpperCase());
    resetRateForm();
    setMessage("Currency rate saved");
  }, [rateForm, resetRateForm, storedToken]);

  const deleteRatePair = useCallback(async (id: string) => {
    if (!id) return;
    if (!window.confirm("Delete this rate pair?")) return;

    const res = await fetch(`/api/admin/rates?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
    });

    if (!res.ok) {
      setMessage("Failed to delete currency rate");
      return;
    }

    const data = (await res.json()) as { rates?: RateEntry[]; rate?: RateEntry; defaultCurrency?: string };
    if (data.rates) setRatesList(data.rates);
    if (data.rate) setRates(data.rate);
    if (data.defaultCurrency) setDefaultCurrency(data.defaultCurrency.toUpperCase());
    if (editingRateId === id) {
      resetRateForm();
    }
    setMessage("Currency rate deleted");
  }, [editingRateId, resetRateForm, storedToken]);

  const saveDefaultCurrency = useCallback(async (currency: string) => {
    const normalized = currency.toUpperCase();
    const res = await fetch("/api/admin/rates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(storedToken ? { "x-admin-token": storedToken } : {}),
      },
      body: JSON.stringify({ defaultCurrency: normalized }),
    });

    if (!res.ok) {
      setMessage("Failed to save default currency");
      return;
    }

    setDefaultCurrency(normalized);
    setMessage("Default currency saved");
  }, [storedToken]);

  const formatPrice = useCallback((usd?: number, tzs?: number) => {
    const active = selectedCurrency.toUpperCase();
    if (active === "TZS") {
      const usableTzs = typeof tzs === "number" ? tzs : undefined;
      if (typeof usableTzs === "number") {
        return `TZS ${usableTzs.toLocaleString()}`;
      }

      const usdTzsRate =
        ratesList.find((r) => r.base.toUpperCase() === "USD" && r.target.toUpperCase() === "TZS")?.rate ||
        (rates.base?.toUpperCase() === "USD" && rates.target?.toUpperCase() === "TZS" ? rates.rate : undefined);
      const converted = Number(usd || 0) * Number(usdTzsRate || 0);
      return `TZS ${Math.round(converted).toLocaleString()}`;
    }

    return `USD ${Number(usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [rates.base, rates.rate, rates.target, ratesList, selectedCurrency]);

  const formatOrderLineTotal = useCallback((order: Order, item: CartItem) => {
    const quantity = Number(item.quantity || 0);
    const orderCurrency = String(order.currency || "").toUpperCase();

    if (orderCurrency === "TZS") {
      const priceTzs =
        typeof item.priceTzs === "number"
          ? item.priceTzs
          : typeof item.priceUsd === "number"
            ? Math.round(item.priceUsd * 2600)
            : 0;
      return `TZS ${(priceTzs * quantity).toLocaleString()}`;
    }

    const priceUsd =
      typeof item.priceUsd === "number"
        ? item.priceUsd
        : typeof item.priceTzs === "number"
          ? item.priceTzs / 2600
          : 0;
    return `USD ${(priceUsd * quantity).toFixed(2)}`;
  }, []);

  const categoryNameById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name] as const));
  }, [categories]);

  const getCategoryLabel = useCallback((categoryId?: string) => {
    const id = (categoryId || "").trim();
    if (!id) return "Uncategorized";
    const fromList = categoryNameById.get(id);
    if (fromList) return fromList;
    if (/^cat-\d+$/i.test(id)) return "Uncategorized";
    return toTitle(id);
  }, [categoryNameById]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!id) return;
    if (!window.confirm("Delete this product?")) return;
    const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
    });
    if (!res.ok) {
      setMessage("Failed to delete product");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (editingProduct?.id === id) setEditingProduct(null);
    setMessage("Product deleted");
  }, [editingProduct?.id, storedToken]);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(storedToken ? { "x-admin-token": storedToken } : {}),
      },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      setMessage("Failed to update order status");
      return;
    }
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
    setMessage("Order status updated");
  }, [storedToken]);

  const deleteOrder = useCallback(async (id: string) => {
    if (!id) return;
    if (!window.confirm("Delete this order?")) return;

    const res = await fetch(`/api/admin/orders?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
    });
    if (!res.ok) {
      setMessage("Failed to delete order");
      return;
    }
    setOrders((prev) => prev.filter((order) => order.id !== id));
    setMessage("Order deleted");
  }, [storedToken]);

  const loadSiteAssets = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = (await res.json()) as { assets?: SiteAssets };
        setSiteAssets(data.assets || {});
        const partnerList = Array.isArray(data.assets?.partners) ? (data.assets?.partners as Partner[]) : [];
        setPartners(partnerList);
      }
    } catch (err) {
      console.error("Failed to load site assets:", err);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) {
      const data = (await res.json()) as { categories: Category[] };
      categoriesLoadedFromDb.current = true;
      setCategories(data.categories || []);
    }
  }, []);

  const saveCategory = useCallback(async () => {
    if (!editingCategory?.id || !editingCategory?.name?.trim()) {
      setMessage("Category id and name are required");
      return;
    }

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(storedToken ? { "x-admin-token": storedToken } : {}),
      },
      body: JSON.stringify({
        id: editingCategory.id.trim(),
        name: editingCategory.name.trim(),
        description: editingCategory.description || "",
        cover: editingCategory.cover || "",
      }),
    });

    if (!res.ok) {
      setMessage("Failed to save category");
      return;
    }

    setMessage("Category saved");
    setEditingCategory(null);
    await loadCategories();
  }, [editingCategory, loadCategories, storedToken]);

  const createCategoryFromName = useCallback(
    async (rawName: string) => {
      const name = rawName.trim();
      if (!name) return null;

      const id = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const payload = {
        id: id || name.toLowerCase(),
        name,
        description: "",
      };

      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(storedToken ? { "x-admin-token": storedToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setMessage("Failed to create category");
        return null;
      }

      await loadCategories();
      setMessage("Category created");
      return payload.id;
    },
    [loadCategories, storedToken],
  );

  const deleteCategory = useCallback(async (id: string) => {
    if (!id) return;
    if (!window.confirm("Delete this category?")) return;

    const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
    });

    if (!res.ok) {
      setMessage("Failed to delete category");
      return;
    }

    setMessage("Category deleted");
    setCategories((prev) => prev.filter((category) => category.id !== id));
    if (editingCategory?.id === id) {
      setEditingCategory(null);
    }
  }, [editingCategory?.id, storedToken]);

  const loadForms = useCallback(async () => {
    setFormsLoading(true);
    const res = await fetch("/api/admin/forms", {
      headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
    });
    if (res.ok) {
      const data = (await res.json()) as { submissions: FormSubmission[] };
      setFormSubmissions(data.submissions || []);
    }
    setFormsLoading(false);
  }, [storedToken]);

  const logAdminSession = useCallback(async () => {
    await fetch("/api/admin/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "session" }),
    });
  }, []);

  const loadEvents = useCallback(async () => {
    const res = await fetch("/api/admin/events", {
      headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
    });
    if (res.ok) {
      const data = (await res.json()) as { items: Event[] };
      setEvents(data.items || []);
    }
  }, [storedToken]);

  const loadBlogPosts = useCallback(async () => {
    const res = await fetch("/api/admin/posts", {
      headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
    });
    if (res.ok) {
      const data = (await res.json()) as { items: BlogPost[] };
      setBlogPosts(data.items || []);
    }
  }, [storedToken]);

  const loadReviews = useCallback(async () => {
    const res = await fetch("/api/admin/reviews", {
      headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
    });
    if (res.ok) {
      const data = (await res.json()) as { items: Review[] };
      setReviews(data.items || []);
    }
  }, [storedToken]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: analyticsDateRange.start + 'T00:00:00Z',
        endDate: analyticsDateRange.end + 'T23:59:59Z',
        event: analyticsEventFilter,
      });
      const res = await fetch(`/api/admin/analytics?${params}`, {
        headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
    setAnalyticsLoading(false);
  }, [analyticsDateRange, analyticsEventFilter, storedToken]);

  const loadSizeToolAnalytics = useCallback(async () => {
    setSizeToolAnalyticsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: analyticsDateRange.start + "T00:00:00Z",
        endDate: analyticsDateRange.end + "T23:59:59Z",
      });
      const res = await fetch(`/api/admin/size-tools/analytics?${params.toString()}`, {
        headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
      });
      if (res.ok) {
        const data = (await res.json()) as SizeToolAnalytics;
        setSizeToolAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to load size tool analytics:", error);
      setSizeToolAnalytics(null);
    }
    setSizeToolAnalyticsLoading(false);
  }, [analyticsDateRange.end, analyticsDateRange.start, storedToken]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setUsersLoading(false);
    }
  }, [storedToken]);

  const loadGiftCards = useCallback(async () => {
    setGiftCardsLoading(true);
    try {
      const res = await fetch("/api/admin/gift-cards", {
        headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
      });
      if (res.ok) {
        const data = (await res.json()) as { cards?: GiftCardRecord[]; requests?: GiftCardRequestRecord[] };
        setGiftCards(data.cards || []);
        setGiftCardRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load gift cards:", err);
    } finally {
      setGiftCardsLoading(false);
    }
  }, [storedToken]);

  const loadDeletedItems = useCallback(async () => {
    setTrashLoading(true);
    try {
      const [eventsRes, reviewsRes, postsRes] = await Promise.all([
        fetch("/api/admin/events?deleted=true", {
          headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        }),
        fetch("/api/admin/reviews?deleted=true", {
          headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        }),
        fetch("/api/admin/posts?deleted=true", {
          headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        }),
      ]);
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setDeletedEvents(data.items || []);
      }
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setDeletedReviews(data.items || []);
      }
      if (postsRes.ok) {
        const data = await postsRes.json();
        setDeletedPosts(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load deleted items:", err);
    }
    setTrashLoading(false);
  }, [storedToken]);

  // data loading
  useEffect(() => {
    if (!authed) return;
    const run = async () => {
      // Load categories first so products can merge into them
      await loadCategories();
      await Promise.all([loadProducts(), loadRates()]);
      await loadSiteAssets();
      await loadOrders();
      await Promise.all([loadEvents(), loadReviews()]);
      await loadDeletedItems(); // Load trash count for sidebar badge
      await logAdminSession();
    };
    void run();
  }, [authed, loadProducts, loadOrders, loadRates, loadSiteAssets, loadCategories, logAdminSession, loadEvents, loadReviews, loadDeletedItems]);

  // Load deleted items when trash section is opened
  useEffect(() => {
    if (authed && activeSection === "trash") {
      loadDeletedItems();
    }
  }, [authed, activeSection, loadDeletedItems]);

  useEffect(() => {
    if (products.length === 0) return;
    requestAnimationFrame(() => {
      setCategories((prev) => {
        const counts = new Map<string, number>();
        products.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
        // Keep category list sourced from DB so deleted categories do not reappear.
        return prev.map((c) => ({ ...c, productCount: counts.get(c.id) || 0 }));
      });
    });
  }, [products]);

  useEffect(() => {
    if (!authed || activeSection !== "forms") return;
    const run = async () => {
      await loadForms();
    };
    void run();
  }, [authed, activeSection, loadForms]);

  useEffect(() => {
    if (!authed || activeSection !== "orders") return;
    const run = async () => {
      await loadOrders();
    };
    void run();
  }, [authed, activeSection, loadOrders]);

  useEffect(() => {
    if (!authed || activeSection !== "users") return;
    loadUsers();
  }, [authed, activeSection, loadUsers]);

  useEffect(() => {
    if (!authed || activeSection !== "giftCards") return;
    loadGiftCards();
  }, [authed, activeSection, loadGiftCards]);

  useEffect(() => {
    if (!authed || activeSection !== "dashboard") return;
    const run = async () => {
      await Promise.all([
        loadOrders(),
        loadProducts(),
        loadEvents(),
        loadReviews(),
        loadAnalytics(),
        loadSizeToolAnalytics(),
      ]);
    };

    void run();
    const pollId = setInterval(() => {
      void run();
    }, 10000);

    return () => clearInterval(pollId);
  }, [authed, activeSection, loadAnalytics, loadEvents, loadOrders, loadProducts, loadReviews, loadSizeToolAnalytics]);

  useEffect(() => {
    if (!authed || activeSection !== "orders") return;
    const pollId = setInterval(() => {
      void loadOrders();
    }, 8000);
    return () => clearInterval(pollId);
  }, [authed, activeSection, loadOrders]);

  // derived
  const filteredProducts = useMemo(
    () =>
      products
        .filter((p) => (productCategoryFilter === "all" ? true : p.category === productCategoryFilter))
        .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())),
    [products, productCategoryFilter, productSearch],
  );
  useEffect(() => {
    // Only derive categories from products if we haven't loaded from DB yet
    if (!categoriesLoadedFromDb.current && products.length > 0) {
      const productCategories = Array.from(new Set(products.map((p) => p.category)));
      setCategories((prev) => {
        // Merge product-derived categories with existing ones
        const existingIds = new Set(prev.map((c) => c.id));
        const newCategories = productCategories
          .filter((id) => !existingIds.has(id))
          .map((id) => ({ id, name: toTitle(id), productCount: products.filter((p) => p.category === id).length }));
        // Update product counts for existing categories
        const updated = prev.map((c) => ({
          ...c,
          productCount: products.filter((p) => p.category === c.id).length,
        }));
        return [...updated, ...newCategories];
      });
    }
  }, [products]);

  const filteredMedia = useMemo(
    () =>
      media.filter((m) => {
        const matchesFilter = mediaFilter === "all" ? true : m.type === mediaFilter;
        const matchesSearch = m.name.toLowerCase().includes(mediaSearch.toLowerCase());
        const matchesProduct =
          mediaProductFilter === "all"
            ? true
            : mediaProductFilter === "uncategorized"
              ? !(m.usedIn && m.usedIn.length > 0)
              : Boolean(m.usedIn?.includes(mediaProductFilter));
        return matchesFilter && matchesSearch && matchesProduct;
      }),
    [media, mediaFilter, mediaSearch, mediaProductFilter],
  );


  const mediaCategoryOptions = useMemo(() => {
    const allCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    return ["all", "uncategorized", ...allCategories];
  }, [products]);

  const groupedMediaByCategory = useMemo(() => {
    const map = new Map<string, MediaItem[]>();

    // Build product->category lookup
    const productToCategory = new Map<string, string>();
    products.forEach(p => productToCategory.set(p.name, p.category));

    filteredMedia.forEach((item) => {
      // Get category from the product this media is used in
      let categoryGroup = "Unassigned";
      if (item.usedIn && item.usedIn.length > 0) {
        const productName = item.usedIn[0];
        categoryGroup = productToCategory.get(productName) || "Unassigned";
      }

      // If filtering by category, skip items that don't match
      if (mediaCategoryFilter !== "all" && mediaCategoryFilter !== "uncategorized") {
        if (categoryGroup !== mediaCategoryFilter) return;
      }
      if (mediaCategoryFilter === "uncategorized" && categoryGroup !== "Unassigned") {
        return;
      }

      if (!map.has(categoryGroup)) {
        map.set(categoryGroup, []);
      }
      map.get(categoryGroup)!.push(item);
    });

    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      if (a[0] === "Unassigned") return 1;
      if (b[0] === "Unassigned") return -1;
      return a[0].localeCompare(b[0]);
    });
    return entries;
  }, [filteredMedia, products, mediaCategoryFilter]);

  const triggerAssetUpload = (setter: (url: string) => void, multiSetter?: (urls: string[]) => void) => {
    sectionAssetUploadResolver.current = setter;
    sectionAssetMultiUploadResolver.current = multiSetter || null;
    sectionAssetInputRef.current?.click();
  };

  const handleSectionAssetUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!sectionAssetUploadResolver.current) return;

    const fileArray = Array.from(files).slice(0, MAX_UPLOAD_FILES);
    const isMulti = files.length > 1 && sectionAssetMultiUploadResolver.current;

    setMessage(`Uploading ${fileArray.length} file(s)...`);
    const { items: uploaded, error } = await uploadAdminFiles(fileArray);

    if (uploaded.length) {
      if (isMulti && sectionAssetMultiUploadResolver.current) {
        sectionAssetMultiUploadResolver.current(uploaded.map(u => u.url));
        setMessage(`${uploaded.length} image(s) uploaded.`);
      } else {
        sectionAssetUploadResolver.current(uploaded[0].url);
        setMessage("Image uploaded.");
      }
    } else {
      setMessage(error ?? "Upload failed. Check credentials.");
    }
    sectionAssetUploadResolver.current = null;
    sectionAssetMultiUploadResolver.current = null;
    if (sectionAssetInputRef.current) {
      sectionAssetInputRef.current.value = "";
    }
  };

  // Proxy external URLs through our API to avoid CORS issues
  const getProxiedUrl = (url?: string) => {
    if (!url) return undefined;
    // Proxy external storage hosts that can trigger cross-origin fetch restrictions.
    if (url.includes("r2.cloudflarestorage.com") || url.includes(".r2.dev") || url.includes("imagekit.io")) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // Fetch a short-lived ImageKit auth token for direct browser uploads (videos)
  const getImageKitAuth = async () => {
    const res = await fetch("/api/admin/upload/auth");
    if (!res.ok) throw new Error("Could not get upload auth token");
    return res.json() as Promise<{ token: string; expire: number; signature: string; publicKey: string }>;
  };

  // Upload video directly from browser to ImageKit — bypasses Vercel's 4.5 MB serverless body limit
  const uploadVideoDirectly = async (file: File): Promise<{ url: string; key: string }> => {
    const auth = await getImageKitAuth();
    const form = new FormData();
    form.append("file", file);
    form.append("fileName", file.name);
    form.append("publicKey", auth.publicKey);
    form.append("signature", auth.signature);
    form.append("expire", String(auth.expire));
    form.append("token", auth.token);
    form.append("folder", "/products");
    form.append("useUniqueFileName", "true");
    const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(`ImageKit video upload failed: ${res.status} ${msg}`);
    }
    const data = await res.json();
    return { url: data.url, key: data.fileId };
  };

  const uploadAdminFiles = async (files: File[]): Promise<{ items: MediaItem[]; error?: string }> => {
    // Upload all files in parallel for maximum speed
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          let url: string;
          let key: string;

          if (file.type.startsWith("video/")) {
            // Videos: direct browser → ImageKit (no Vercel body size limit, no server hop)
            const result = await uploadVideoDirectly(file);
            url = result.url;
            key = result.key;
          } else {
            // Images: through server (resize, compress to WebP, watermark applied)
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
            if (!res.ok) {
              const errBody = await res.json().catch(() => ({} as Record<string, unknown>));
              throw new Error(typeof errBody.error === "string" ? errBody.error : `Upload failed (${res.status})`);
            }
            const data = await res.json().catch(() => ({} as Record<string, unknown>));
            url = typeof data.url === "string" ? data.url : "";
            key = typeof data.key === "string" ? data.key : url;
            if (!url) throw new Error("No URL returned from server");
          }

          return {
            item: {
              id: key,
              name: file.name,
              url,
              type: file.type.startsWith("video/") ? "video" : "image",
              usedIn: [],
            } as MediaItem,
            error: undefined as string | undefined,
          };
        } catch (err) {
          return {
            item: null as MediaItem | null,
            error: err instanceof Error ? err.message : "Upload failed",
          };
        }
      })
    );
    const items = results.filter((r) => r.item).map((r) => r.item as MediaItem);
    const error = results.find((r) => r.error)?.error;
    return { items, error };
  };

  const onUploadMedia = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).slice(0, MAX_UPLOAD_FILES);
    setMessage(`Uploading ${fileArray.length} file(s)...`);
    const { items: newItems, error } = await uploadAdminFiles(fileArray);
    if (newItems.length) {
      setMedia((prev) => [...newItems, ...prev]);
      setMessage(`${newItems.length} media file(s) uploaded.`);
    } else {
      setMessage(error ?? "Upload failed. Check file size and format.");
    }
  };

  const onUploadProductMedia = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingProduct) return;
    const fileArray = Array.from(files).slice(0, MAX_UPLOAD_FILES);
    setMessage(`Uploading ${fileArray.length} file(s)...`);
    const { items: newItems, error } = await uploadAdminFiles(fileArray);
    if (newItems.length) {
      setMedia((prev) => [...newItems, ...prev]);
      const productMedia: ProductMedia[] = newItems.map((item) => ({
        id: item.id,
        src: item.url,
        alt: item.name || editingProduct.name,
        type: item.type,
      }));
      setEditingProduct({
        ...editingProduct,
        media: [...(editingProduct.media || []), ...productMedia],
      });
      setMessage(`${newItems.length} media file(s) uploaded and attached.`);
    } else {
      setMessage(error ?? "Upload failed. Check file size and format.");
    }
  };

  const attachMediaToProduct = (item: MediaItem) => {
    if (!editingProduct) return;
    const next: ProductMedia[] = [...(editingProduct.media || []), { id: item.id, src: item.url, alt: item.name, type: item.type }];
    setEditingProduct({ ...editingProduct, media: next });
    const targetId = item.id || item.url;
    if (targetId) {
      setMedia((prev) =>
        prev.map((mediaItem) => {
          const mediaKey = mediaItem.id || mediaItem.url;
          if (mediaKey !== targetId) return mediaItem;
          const nextUsed = Array.from(new Set([...(mediaItem.usedIn || []), editingProduct.name]));
          return { ...mediaItem, usedIn: nextUsed };
        }),
      );
      setSelectedMedia((prev) =>
        prev && (prev.id || prev.url) === targetId
          ? { ...prev, usedIn: Array.from(new Set([...(prev.usedIn || []), editingProduct.name])) }
          : prev,
      );
    }
    setMessage("Media attached");
  };

  const saveProduct = async (product: AdminProduct) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(storedToken ? { "x-admin-token": storedToken } : {}),
        },
        body: JSON.stringify(product),
      });

      const data = (await res.json().catch(() => ({}))) as {
        stockNotifications?: { sent?: number; total?: number } | null;
      };

      if (!res.ok) {
        setMessage("Failed to save product");
        return;
      }

      const sent = Number(data.stockNotifications?.sent || 0);
      const total = Number(data.stockNotifications?.total || 0);

      if (total > 0) {
        setMessage(`Product saved. Sent ${sent}/${total} stock alerts.`);
      } else {
        setMessage("Product saved");
      }

      setEditingProduct(null);
      await loadProducts();
    } catch (error) {
      console.error("Failed to save product:", error);
      setMessage("Failed to save product");
    }
  };

  const steps: { key: "basics" | "story" | "size" | "media" | "visibility" | "relations"; label: string }[] = [
    { key: "basics", label: "Basics" },
    { key: "story", label: "Story & Details" },
    { key: "size", label: "Size & Care" },
    { key: "media", label: "Media" },
    { key: "visibility", label: "Visibility" },
    { key: "relations", label: "Relations" },
  ];

  // UI helpers
  const renderTopBar = () => {
    const currencyChoices = Array.from(new Set([rates.base, defaultCurrency, ...ratesList.map((r) => r.target)])).filter(Boolean) as string[];
    const options = currencyChoices.length ? currencyChoices : ["USD", "TZS"];
    return (
      <header className="flex flex-col gap-3 border-b border-mubah-mid/60 bg-mubah-mid/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-mubah-orange/80">Admin</div>
            <div className="font-display text-xl capitalize leading-tight">{labelize(activeSection)}</div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/subscribers"
              className="rounded-full border border-mubah-mid px-3 py-2 text-xs hover:border-mubah-orange min-h-[44px] touch-manipulation"
            >
              Subscribers
            </Link>
            <button
              onClick={() => {
                void logoutAdmin();
              }}
              className="rounded-full border border-mubah-mid px-3 py-2 text-xs hover:border-mubah-orange min-h-[44px] touch-manipulation"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2 rounded-full border border-mubah-mid bg-mubah-mid/40 px-3 py-1.5 text-mubah-cream/80">
            <span className="text-xs">Currency</span>
            <CustomSelect
              value={selectedCurrency}
              onChange={setSelectedCurrency}
              options={options.map((c) => ({ value: c, label: c }))}
            />
            <span className="text-xs text-mubah-cream/60 hidden sm:inline">Rate {rates.rate} ({rates.base}{" -> "}{rates.target})</span>
          </div>
        </div>
      </header>
    );
  };

  const renderMobileNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-mubah-mid bg-mubah-deep/95 backdrop-blur-sm md:hidden safe-area-inset-bottom">
      <div className="overflow-x-auto overflow-y-hidden">
        <div className="flex items-center gap-1 px-2 py-2 min-w-max">
          {[
            { key: "dashboard", label: "Dashboard" },
            { key: "categories", label: "Categories" },
            { key: "products", label: "Products" },
            { key: "quickshop", label: "Quick Shop" },
            { key: "storefrontControls", label: "Storefront Controls" },
            { key: "signatureCuts", label: "Signature Cuts" },
            { key: "instagramFeed", label: "Instagram" },
            { key: "editorialCustomers", label: "Real People" },
            { key: "events", label: "Events" },
            { key: "reviews", label: "Reviews" },
            { key: "users", label: "Users" },
            { key: "partners", label: "Partners" },
            { key: "currency", label: "Currency" },
            { key: "media", label: "Media" },
            { key: "orders", label: "Orders" },
            { key: "giftCards", label: "Gift cards" },
            { key: "forms", label: "Forms" },
            { key: "trash", label: "Recycle" },
            { key: "password", label: "Security" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key as typeof activeSection)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition touch-manipulation whitespace-nowrap ${
                activeSection === item.key ? "text-mubah-orange bg-mubah-orange/10" : "text-mubah-cream/70 active:bg-mubah-mid/30"
              }`}
            >
              <span className="text-[10px] sm:text-[11px] leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );

  const renderSidebar = () => {
    const trashCount = deletedEvents.length + deletedReviews.length + deletedPosts.length;
    return (
      <aside className="hidden w-72 flex-shrink-0 flex-col gap-6 border-r border-mubah-mid bg-mubah-mid/15 px-4 py-6 md:flex">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.26em] text-mubah-orange/90">MERAKI ADMIN</div>
          <div className="font-display text-2xl leading-tight">Control Center</div>
        </div>
        <nav className="space-y-2 text-sm">
          {[
            { key: "dashboard", label: "Dashboard" },
            { key: "categories", label: "Categories" },
            { key: "products", label: "Products" },
            { key: "quickshop", label: "Quick Shop" },
            { key: "storefrontControls", label: "Storefront Controls" },
            { key: "signatureCuts", label: "Signature Cuts" },
            { key: "instagramFeed", label: "Instagram Feed" },
            { key: "editorialCustomers", label: "Real People" },
            { key: "events", label: "Events" },
            { key: "reviews", label: "Reviews" },
            { key: "users", label: "Users" },
            { key: "partners", label: "Partners" },
            { key: "currency", label: "Currency" },
            { key: "media", label: "Media Library" },
            { key: "orders", label: "Orders" },
            { key: "giftCards", label: "Gift cards" },
            { key: "forms", label: "Form submissions" },
            { key: "trash", label: "Recycle Bin" },
            { key: "password", label: "Security" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key as typeof activeSection)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${activeSection === item.key ? "bg-mubah-mid/40 text-mubah-orange" : "hover:bg-mubah-mid/20"
                }`}
            >
              <span className="flex-1">{item.label}</span>
              {item.key === "trash" && trashCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {trashCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>
    );
  };

  const renderDashboard = () => {
    // Filter orders by selected currency
    const currencyOrders = orders.filter(o => o.currency === selectedCurrency);

    // Calculate analytics from orders in selected currency
    const totalRevenue = currencyOrders.reduce((sum, order) => {
      if (order.status !== 'cancelled') {
        return sum + (order.total || 0);
      }
      return sum;
    }, 0);

    const totalOrders = currencyOrders.filter(o => o.status !== 'cancelled').length;
    const pendingOrders = currencyOrders.filter(o => o.status === 'pending').length;
    const processingOrders = currencyOrders.filter(o => o.status === 'processing').length;
    const shippedOrders = currencyOrders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = currencyOrders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = currencyOrders.filter(o => o.status === 'cancelled').length;

    // Calculate stock value (current inventory * price)
    const stockValue = products.reduce((sum, product) => {
      const price = product.priceUsd || 0;
      const stock = product.stock || 0;
      return sum + (price * stock);
    }, 0);

    // Total items sold
    const itemsSold = currencyOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, order) => {
        return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0);
      }, 0);

    // Average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Use the selected currency
    const currency = selectedCurrency;

    return (
      <section className="space-y-4">
        {/* Revenue & Sales Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-mubah-orange/30 bg-mubah-orange/5 p-4 shadow-[var(--shadow-card)]">
            <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Total Revenue</div>
            <div className="mt-2 text-2xl font-bold text-mubah-orange">
              {currency} {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-xs text-mubah-cream/60">From {totalOrders} completed orders</div>
          </div>

          <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4 shadow-[var(--shadow-card)]">
            <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Stock Value</div>
            <div className="mt-2 text-2xl font-bold text-mubah-cream">
              {currency} {stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-xs text-mubah-cream/60">{products.length} products in inventory</div>
          </div>

          <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4 shadow-[var(--shadow-card)]">
            <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Average Order</div>
            <div className="mt-2 text-2xl font-bold text-mubah-cream">
              {currency} {avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-xs text-mubah-cream/60">{itemsSold} items sold total</div>
          </div>

          <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4 shadow-[var(--shadow-card)]">
            <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Total Orders</div>
            <div className="mt-2 text-2xl font-bold text-mubah-cream">{orders.length}</div>
            <div className="mt-1 text-xs text-mubah-cream/60">
              {totalOrders} active - {cancelledOrders} cancelled
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-5 shadow-[var(--shadow-card)]">
          <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Order Status Breakdown</div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
              <div className="text-xs text-yellow-400">Pending</div>
              <div className="mt-1 text-xl font-bold text-yellow-300">{pendingOrders}</div>
            </div>
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <div className="text-xs text-blue-400">Processing</div>
              <div className="mt-1 text-xl font-bold text-blue-300">{processingOrders}</div>
            </div>
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
              <div className="text-xs text-purple-400">Shipped</div>
              <div className="mt-1 text-xl font-bold text-purple-300">{shippedOrders}</div>
            </div>
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <div className="text-xs text-green-400">Delivered</div>
              <div className="mt-1 text-xl font-bold text-green-300">{deliveredOrders}</div>
            </div>
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <div className="text-xs text-red-400">Cancelled</div>
              <div className="mt-1 text-xl font-bold text-red-300">{cancelledOrders}</div>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-5 shadow-[var(--shadow-card)]">
          <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Welcome to MERAKI Admin</div>
          <p className="mt-2 text-lg text-mubah-cream">Manage products, categories, media, and orders in one place.</p>
          <p className="text-mubah-cream/70">Use the sidebar to jump between sections. Changes save with the burnt-orange buttons.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Catalog</div>
            <ul className="mt-3 space-y-2 text-sm text-mubah-cream/80">
              <li className="flex justify-between">
                <span>Products:</span>
                <span className="font-semibold">{products.length}</span>
              </li>
              <li className="flex justify-between">
                <span>Categories:</span>
                <span className="font-semibold">{categories.length || "auto"}</span>
              </li>
              <li className="flex justify-between">
                <span>In Stock:</span>
                <span className="font-semibold">{products.filter(p => (p.stock || 0) > 0).length}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Content</div>
            <ul className="mt-3 space-y-2 text-sm text-mubah-cream/80">
              <li className="flex justify-between">
                <span>Events:</span>
                <span className="font-semibold">{events.length}</span>
              </li>
              <li className="flex justify-between">
                <span>Reviews:</span>
                <span className="font-semibold">{reviews.length}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Media</div>
            <ul className="mt-3 space-y-2 text-sm text-mubah-cream/80">
              <li className="flex justify-between">
                <span>Total Files:</span>
                <span className="font-semibold">{media.length}</span>
              </li>
              <li className="flex justify-between">
                <span>Partners:</span>
                <span className="font-semibold">{partners.length}</span>
              </li>
              <li className="flex justify-between">
                <span>Users:</span>
                <span className="font-semibold">{users.length}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Analytics Dashboard</div>
            <button onClick={loadAnalytics} className={ghostBtn + " !py-1.5 !px-3"}>
              {analyticsLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* Date Range & Event Filter */}
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs text-mubah-cream/70">Start Date</label>
              <input
                type="date"
                value={analyticsDateRange.start}
                onChange={(e) => setAnalyticsDateRange({ ...analyticsDateRange, start: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-mubah-cream/70">End Date</label>
              <input
                type="date"
                value={analyticsDateRange.end}
                onChange={(e) => setAnalyticsDateRange({ ...analyticsDateRange, end: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-mubah-cream/70">Event Type</label>
              <select
                value={analyticsEventFilter}
                onChange={(e) => setAnalyticsEventFilter(e.target.value)}
                className={inputCls}
              >
                <option value="all">All Events</option>
                <option value="page_view">Page Views</option>
                <option value="product_view">Product Views</option>
                <option value="add_to_cart">Add to Cart</option>
                <option value="purchase">Purchases</option>
              </select>
            </div>
          </div>

          {/* Analytics Metrics */}
          {analyticsLoading ? (
            <div className="mt-4 py-8 text-center text-mubah-cream/60">Loading analytics...</div>
          ) : (
            <>
              {(() => {
                const pageViewCount = analyticsEvents.filter((e) => e.event === 'page_view').length;
                const productViewCount = analyticsEvents.filter((e) => e.event === 'product_view').length;
                const addToCartCount = analyticsEvents.filter((e) => e.event === 'add_to_cart').length;
                const purchaseEvents = analyticsEvents.filter((e) => e.event === 'purchase');
                const purchaseCount = purchaseEvents.length;
                
                // Calculate revenue metrics
                const totalRevenue = purchaseEvents.reduce((sum, e) => {
                  return sum + (e.data?.total || 0);
                }, 0);
                
                const averageOrderValue = purchaseCount > 0 ? totalRevenue / purchaseCount : 0;
                
                // Cart abandonment: users who added to cart but didn't purchase
                const cartAbandonment = addToCartCount > 0 
                  ? (((addToCartCount - purchaseCount) / addToCartCount) * 100).toFixed(1)
                  : '0';

                return (
                  <>
                    {/* Main Metrics */}
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                        <div className="text-xs text-blue-400">Page Views</div>
                        <div className="mt-1 text-2xl font-bold text-blue-300">{pageViewCount}</div>
                      </div>
                      <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
                        <div className="text-xs text-purple-400">Product Views</div>
                        <div className="mt-1 text-2xl font-bold text-purple-300">{productViewCount}</div>
                      </div>
                      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                        <div className="text-xs text-yellow-400">Add to Cart</div>
                        <div className="mt-1 text-2xl font-bold text-yellow-300">{addToCartCount}</div>
                      </div>
                      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                        <div className="text-xs text-green-400">Purchases</div>
                        <div className="mt-1 text-2xl font-bold text-green-300">{purchaseCount}</div>
                      </div>
                    </div>

                    {/* Revenue Metrics */}
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                        <div className="text-xs text-emerald-400">Total Revenue</div>
                        <div className="mt-1 text-2xl font-bold text-emerald-300">
                          ${totalRevenue.toFixed(2)}
                        </div>
                        <div className="mt-1 text-xs text-emerald-400/70">
                          {purchaseCount} {purchaseCount === 1 ? 'order' : 'orders'}
                        </div>
                      </div>
                      <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-3">
                        <div className="text-xs text-teal-400">Avg Order Value</div>
                        <div className="mt-1 text-2xl font-bold text-teal-300">
                          ${averageOrderValue.toFixed(2)}
                        </div>
                        <div className="mt-1 text-xs text-teal-400/70">per order</div>
                      </div>
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                        <div className="text-xs text-red-400">Cart Abandonment</div>
                        <div className="mt-1 text-2xl font-bold text-red-300">{cartAbandonment}%</div>
                        <div className="mt-1 text-xs text-red-400/70">
                          {addToCartCount - purchaseCount} abandoned
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Top Products */}
              {(() => {
                const productViews = analyticsEvents
                  .filter((e) => e.event === 'product_view' && e.data?.productId)
                  .reduce((acc, e) => {
                    const id = e.data.productId;
                    acc[id] = (acc[id] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                
                // Calculate revenue by product
                const productRevenue = analyticsEvents
                  .filter((e) => e.event === 'purchase' && e.data?.items)
                  .reduce((acc, e) => {
                    (e.data.items || []).forEach((item: any) => {
                      const id = item.id || item.productId;
                      if (id) {
                        const priceUsd =
                          typeof item.priceUsd === "number"
                            ? item.priceUsd
                            : typeof item.priceTzs === "number"
                              ? item.priceTzs / 2600
                              : 0;
                        const quantity = Number(item.quantity || 0);
                        acc[id] = (acc[id] || 0) + (priceUsd * quantity);
                      }
                    });
                    return acc;
                  }, {} as Record<string, number>);
                
                const topProducts = Object.entries(productViews)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([id, count]) => ({
                    id,
                    name: products.find((p) => p.id === id)?.name || id,
                    views: count,
                    revenue: productRevenue[id] || 0,
                  }));
                
                const topByRevenue = Object.entries(productRevenue)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([id, revenue]) => ({
                    id,
                    name: products.find((p) => p.id === id)?.name || id,
                    views: productViews[id] || 0,
                    revenue,
                  }));

                return (
                  <>
                    {topProducts.length > 0 && (
                      <div className="mt-4 rounded-lg border border-mubah-mid bg-mubah-mid/30 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Top 5 Products by Views</div>
                        <div className="mt-3 space-y-2">
                          {topProducts.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-mubah-cream truncate flex-1">{item.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-mubah-cream/60">{item.views} views</span>
                                <span className="font-semibold text-emerald-400">${item.revenue.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {topByRevenue.length > 0 && (
                      <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-emerald-400">Top 5 Products by Revenue</div>
                        <div className="mt-3 space-y-2">
                          {topByRevenue.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-mubah-cream truncate flex-1">{item.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-mubah-cream/60">{item.views} views</span>
                                <span className="font-semibold text-emerald-300">${item.revenue.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Revenue Trend Chart (Simple Bar Chart) */}
              {(() => {
                const purchaseEvents = analyticsEvents.filter((e) => e.event === 'purchase');
                
                if (purchaseEvents.length === 0) return null;
                
                // Group purchases by date
                const revenueByDate = purchaseEvents.reduce((acc, e) => {
                  const date = e.timestamp.split('T')[0];
                  acc[date] = (acc[date] || 0) + (e.data?.total || 0);
                  return acc;
                }, {} as Record<string, number>);
                
                const sortedDates = Object.keys(revenueByDate).sort();
                const maxRevenue = Math.max(...Object.values(revenueByDate));
                
                return (
                  <div className="mt-4 rounded-lg border border-mubah-mid bg-mubah-mid/30 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80 mb-4">Revenue Trend</div>
                    <div className="space-y-2">
                      {sortedDates.map((date) => {
                        const revenue = revenueByDate[date];
                        const percentage = (revenue / maxRevenue) * 100;
                        return (
                          <div key={date} className="flex items-center gap-3">
                            <div className="text-xs text-mubah-cream/60 w-20">{date}</div>
                            <div className="flex-1 bg-mubah-mid/50 rounded-full h-6 relative overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full flex items-center px-2 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              >
                                {percentage > 30 && (
                                  <span className="text-xs text-white font-semibold">${revenue.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                            {percentage <= 30 && (
                              <span className="text-xs text-emerald-400 font-semibold w-20 text-right">${revenue.toFixed(2)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-xs text-mubah-cream/50 text-center">
                      Daily revenue for selected period
                    </div>
                  </div>
                );
              })()}

              {/* Recent Events */}
              <div className="mt-4 rounded-lg border border-mubah-mid bg-mubah-mid/30 p-4 max-h-80 overflow-y-auto">
                <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Recent Events</div>
                <div className="mt-3 space-y-2">
                  {analyticsEvents.slice(0, 20).map((event) => (
                    <div key={event.id} className="rounded-lg border border-mubah-mid/50 bg-mubah-mid/20 p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-mubah-cream">{event.event}</span>
                        <span className="text-mubah-cream/60">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {event.url && (
                        <div className="mt-1 text-mubah-cream/70 truncate">{event.url}</div>
                      )}
                      {event.data && Object.keys(event.data).length > 0 && (
                        <div className="mt-1 text-mubah-cream/60">
                          {JSON.stringify(event.data)}
                        </div>
                      )}
                    </div>
                  ))}
                  {analyticsEvents.length === 0 && (
                    <div className="py-4 text-center text-mubah-cream/60">No events in this period</div>
                  )}
                </div>
              </div>

              {/* Conversion Funnel */}
              {(() => {
                const pageViews = analyticsEvents.filter((e) => e.event === 'page_view').length;
                const productViews = analyticsEvents.filter((e) => e.event === 'product_view').length;
                const cartAdds = analyticsEvents.filter((e) => e.event === 'add_to_cart').length;
                const purchases = analyticsEvents.filter((e) => e.event === 'purchase').length;

                const productViewRate = pageViews > 0 ? ((productViews / pageViews) * 100).toFixed(1) : '0';
                const cartRate = productViews > 0 ? ((cartAdds / productViews) * 100).toFixed(1) : '0';
                const purchaseRate = cartAdds > 0 ? ((purchases / cartAdds) * 100).toFixed(1) : '0';

                return (
                  <div className="mt-4 rounded-lg border border-mubah-mid bg-mubah-mid/30 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Conversion Funnel</div>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-mubah-cream">Page Views  Product Views</span>
                        <span className="font-semibold text-mubah-orange">{productViewRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-mubah-cream">Product Views  Add to Cart</span>
                        <span className="font-semibold text-mubah-orange">{cartRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-mubah-cream">Add to Cart  Purchase</span>
                        <span className="font-semibold text-mubah-orange">{purchaseRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Size Tool Analytics</div>
            <button onClick={loadSizeToolAnalytics} className={ghostBtn + " !py-1.5 !px-3"}>
              {sizeToolAnalyticsLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
          {sizeToolAnalyticsLoading ? (
            <div className="mt-4 py-6 text-center text-mubah-cream/60">Loading size analytics...</div>
          ) : !sizeToolAnalytics ? (
            <div className="mt-4 py-6 text-center text-mubah-cream/60">No size tool analytics available.</div>
          ) : (
            <>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-mubah-mid/70 bg-mubah-mid/30 p-3">
                  <div className="text-xs text-mubah-cream/60">Events</div>
                  <div className="mt-1 text-2xl font-bold text-mubah-cream">{sizeToolAnalytics.summary?.totalEvents || 0}</div>
                </div>
                <div className="rounded-lg border border-mubah-mid/70 bg-mubah-mid/30 p-3">
                  <div className="text-xs text-mubah-cream/60">Find My Size</div>
                  <div className="mt-1 text-2xl font-bold text-mubah-cream">{sizeToolAnalytics.summary?.totalFindMySize || 0}</div>
                </div>
                <div className="rounded-lg border border-mubah-mid/70 bg-mubah-mid/30 p-3">
                  <div className="text-xs text-mubah-cream/60">Length Guide</div>
                  <div className="mt-1 text-2xl font-bold text-mubah-cream">{sizeToolAnalytics.summary?.totalLengthGuide || 0}</div>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className="text-xs text-emerald-300">Recommendation Match</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-200">
                    {sizeToolAnalytics.summary?.recommendationAcceptanceRate || 0}%
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-mubah-mid bg-mubah-mid/30 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Top Recommended Sizes</div>
                  <div className="mt-3 space-y-2">
                    {(sizeToolAnalytics.topRecommendedSizes || []).slice(0, 5).map((row) => (
                      <div key={`rec-${row.label}`} className="flex items-center justify-between text-sm">
                        <span className="text-mubah-cream">{row.label}</span>
                        <span className="text-mubah-cream/70">{row.count}</span>
                      </div>
                    ))}
                    {(sizeToolAnalytics.topRecommendedSizes || []).length === 0 && (
                      <div className="text-sm text-mubah-cream/60">No recommendation data yet.</div>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-mubah-mid bg-mubah-mid/30 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Top Selected Sizes</div>
                  <div className="mt-3 space-y-2">
                    {(sizeToolAnalytics.topSelectedSizes || []).slice(0, 5).map((row) => (
                      <div key={`sel-${row.label}`} className="flex items-center justify-between text-sm">
                        <span className="text-mubah-cream">{row.label}</span>
                        <span className="text-mubah-cream/70">{row.count}</span>
                      </div>
                    ))}
                    {(sizeToolAnalytics.topSelectedSizes || []).length === 0 && (
                      <div className="text-sm text-mubah-cream/60">No selection data yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-mubah-mid bg-mubah-mid/30 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange/80">Conversion Impact</div>
                <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm">
                  <div>
                    <div className="text-mubah-cream/60">Orders using size tools</div>
                    <div className="text-xl font-semibold text-mubah-cream">
                      {sizeToolAnalytics.conversionImpact?.sizeToolOrderCount || 0}
                      <span className="ml-1 text-sm text-mubah-cream/60">
                        ({sizeToolAnalytics.conversionImpact?.sizeToolOrderRate || 0}%)
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-mubah-cream/60">AOV with size tools</div>
                    <div className="text-xl font-semibold text-emerald-300">
                      ${Number(sizeToolAnalytics.conversionImpact?.avgOrderValueWithSizeTool || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-mubah-cream/60">AOV without size tools</div>
                    <div className="text-xl font-semibold text-mubah-cream">
                      ${Number(sizeToolAnalytics.conversionImpact?.avgOrderValueWithoutSizeTool || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    );
  };

  const renderCategories = () => (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Categories</div>
          <button
            className={orangeBtn}
            onClick={() => setEditingCategory({ id: `cat-${Date.now()}`, name: "New category", description: "" })}
          >
            + Add Category
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {categories.map((cat, idx) => {
            const isSelectedForReorder = categoryReorderSelection === idx;
            const handleReorderClick = () => {
              if (categoryReorderSelection === null) {
                setCategoryReorderSelection(idx);
              } else if (categoryReorderSelection !== idx) {
                // Swap positions
                const newCategories = [...categories];
                const temp = newCategories[categoryReorderSelection];
                newCategories[categoryReorderSelection] = newCategories[idx];
                newCategories[idx] = temp;
                setCategories(newCategories);
                setCategoryReorderSelection(null);
              } else {
                // Clicked same one - deselect
                setCategoryReorderSelection(null);
              }
            };
            return (
              <div key={cat.id} className={`relative rounded-xl border bg-mubah-mid/30 p-3 shadow-sm ${isSelectedForReorder ? 'border-mubah-orange ring-2 ring-mubah-orange/50' : 'border-mubah-mid'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-mubah-cream">{cat.name}</div>
                    <p className="text-sm text-mubah-cream/70">{cat.description || "No description yet."}</p>
                    <p className="text-xs text-mubah-cream/60">{cat.productCount || 0} products</p>
                  </div>
                  <div className="flex gap-2">
                    <button className={ghostBtn} onClick={() => setEditingCategory(cat)}>
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => deleteCategory(cat.id)}
                    >
                       Delete
                    </button>
                  </div>
                </div>
                {/* Reorder number circle */}
                <button
                  type="button"
                  onClick={handleReorderClick}
                  className={`absolute -bottom-2 -right-2 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md transition cursor-pointer ${isSelectedForReorder
                    ? 'bg-mubah-orange text-mubah-deep ring-2 ring-mubah-orange/50'
                    : 'bg-mubah-mid text-mubah-cream hover:bg-mubah-orange/80 hover:text-mubah-deep'
                    }`}
                  title={categoryReorderSelection === null ? "Click to select for reordering" : "Click to swap with selected"}
                >
                  {idx + 1}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/25 p-4">
        <div className="flex items-center justify-between text-sm uppercase tracking-[0.18em] text-mubah-orange">
          <span>{editingCategory ? "Edit category" : "Select a category"}</span>
        </div>
        {editingCategory ? (
          <div className="mt-3 space-y-4 text-sm">
            <FormErrorList errors={formErrors.category} />
            <input
              value={editingCategory.name}
              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              placeholder="Category name"
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
            />
            <textarea
              value={editingCategory.description || ""}
              onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
              placeholder="Short description"
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 min-h-[48px]"
              rows={3}
            />

            {/* Category Images Section */}
            <div className="space-y-3 rounded-xl border border-mubah-mid/50 bg-mubah-mid/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange">Cover Images</div>
                <span className="text-[10px] text-mubah-cream/60">
                  {(editingCategory.covers?.length || (editingCategory.cover ? 1 : 0))}/10 images
                </span>
              </div>

              {/* Current Images Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(() => {
                  const allCovers = editingCategory.covers?.length
                    ? editingCategory.covers
                    : (editingCategory.cover ? [editingCategory.cover] : []);
                  return allCovers.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-mubah-mid/40 bg-mubah-mid/30">
                      {url.match(/\.(mp4|mov|webm|m4v)$/i) ? (
                        <div className="flex h-full w-full items-center justify-center text-2xl bg-mubah-mid/50"></div>
                      ) : (
                        <img src={getProxiedUrl(url)} alt={`Cover ${idx + 1}`} className="h-full w-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {idx > 0 && (
                          <button
                            type="button"
                            className="rounded-full bg-mubah-cream/90 p-1.5 text-xs text-mubah-deep"
                            onClick={() => {
                              const next = [...allCovers];
                              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                              setEditingCategory({ ...editingCategory, covers: next, cover: next[0] });
                            }}
                            title="Move left"
                          ></button>
                        )}
                        <button
                          type="button"
                          className="rounded-full bg-red-500 p-1.5 text-xs text-white"
                          onClick={() => {
                            const next = allCovers.filter((_, i) => i !== idx);
                            setEditingCategory({ ...editingCategory, covers: next, cover: next[0] || "" });
                          }}
                          title="Remove"
                        ></button>
                        {idx < allCovers.length - 1 && (
                          <button
                            type="button"
                            className="rounded-full bg-mubah-cream/90 p-1.5 text-xs text-mubah-deep"
                            onClick={() => {
                              const next = [...allCovers];
                              [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                              setEditingCategory({ ...editingCategory, covers: next, cover: next[0] });
                            }}
                            title="Move right"
                          ></button>
                        )}
                      </div>
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 rounded bg-mubah-orange px-1.5 py-0.5 text-[9px] font-bold text-mubah-deep">MAIN</div>
                      )}
                    </div>
                  ));
                })()}

                {/* Add More Button */}
                {(editingCategory.covers?.length || (editingCategory.cover ? 1 : 0)) < MAX_UPLOAD_FILES && (
                  <button
                    type="button"
                    className="aspect-square rounded-lg border-2 border-dashed border-mubah-mid/60 bg-mubah-mid/10 flex flex-col items-center justify-center gap-1 text-mubah-cream/60 hover:border-mubah-orange/60 hover:text-mubah-orange transition"
                    onClick={() => {
                      triggerAssetUpload((url) => {
                        const current = editingCategory.covers?.length
                          ? editingCategory.covers
                          : (editingCategory.cover ? [editingCategory.cover] : []);
                        const next = [...current, url].slice(0, MAX_UPLOAD_FILES);
                        setEditingCategory({ ...editingCategory, covers: next, cover: next[0] });
                      });
                    }}
                  >
                    <span className="text-xl">+</span>
                    <span className="text-[10px]">Add image</span>
                  </button>
                )}
              </div>

              {/* URL Input */}
              <div className="flex gap-2">
                <input
                  placeholder="Paste image URL and press Add"
                  className="flex-1 rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target as HTMLInputElement;
                      const url = input.value.trim();
                      if (!url) return;
                      const current = editingCategory.covers?.length
                        ? editingCategory.covers
                        : (editingCategory.cover ? [editingCategory.cover] : []);
                      if (current.length >= MAX_UPLOAD_FILES) {
                        setMessage(`Maximum ${MAX_UPLOAD_FILES} images allowed`);
                        return;
                      }
                      const next = [...current, url];
                      setEditingCategory({ ...editingCategory, covers: next, cover: next[0] });
                      input.value = "";
                    }
                  }}
                />
                <button
                  type="button"
                  className={ghostBtn}
                  onClick={(e) => {
                    const input = (e.target as HTMLElement).previousSibling as HTMLInputElement;
                    const url = input?.value?.trim();
                    if (!url) return;
                    const current = editingCategory.covers?.length
                      ? editingCategory.covers
                      : (editingCategory.cover ? [editingCategory.cover] : []);
                    if (current.length >= MAX_UPLOAD_FILES) {
                      setMessage(`Maximum ${MAX_UPLOAD_FILES} images allowed`);
                      return;
                    }
                    const next = [...current, url];
                    setEditingCategory({ ...editingCategory, covers: next, cover: next[0] });
                    input.value = "";
                  }}
                >
                  Add
                </button>
              </div>

              <p className="text-[10px] text-mubah-cream/50">First image is the main cover. Drag arrows to reorder. Max {MAX_UPLOAD_FILES} images/videos.</p>
            </div>

            {/* Preview Card */}
            <div className="rounded-lg border border-mubah-mid bg-mubah-mid/20 p-3">
              <div className="text-xs uppercase tracking-[0.18em] text-mubah-orange">Preview</div>
              <div className="mt-2 flex items-center gap-3">
                <div
                  className="h-16 w-20 rounded-lg bg-mubah-mid/40 flex-shrink-0"
                  style={{
                    backgroundImage: (editingCategory.covers?.[0] || editingCategory.cover)
                      ? `url(${getProxiedUrl(editingCategory.covers?.[0] || editingCategory.cover)})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                >
                  {!(editingCategory.covers?.[0] || editingCategory.cover) && (
                    <div className="flex h-full w-full items-center justify-center text-xs text-mubah-cream/40">No image</div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-mubah-cream">{editingCategory.name}</div>
                  <div className="text-xs text-mubah-cream/70">{editingCategory.description || "Add a short line"}</div>
                  {(editingCategory.covers?.length || 0) > 1 && (
                    <div className="text-[10px] text-mubah-orange mt-1">+{(editingCategory.covers?.length || 1) - 1} more images</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button className={orangeBtn} onClick={saveCategory}>
                Save changes
              </button>
              <button className={ghostBtn} onClick={() => setEditingCategory(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-mubah-cream/70">Pick a category or create a new one to edit details.</p>
        )}
      </div>
    </section>
  );

  const renderCurrency = () => {
    const currencyChoices = Array.from(new Set([rates.base, ...ratesList.map((r) => r.target)])).filter(Boolean) as string[];
    return (
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Currencies</div>
            <button className={ghostBtn} onClick={loadRates}>
              Refresh
            </button>
          </div>
          <div className="mt-3 overflow-auto rounded-xl border border-mubah-mid bg-mubah-mid/30">
            <table className="min-w-[640px] w-full text-sm text-mubah-cream/90">
              <thead className="bg-mubah-mid/40 text-xs uppercase tracking-[0.12em] text-mubah-cream/70">
                <tr>
                  <th className="px-3 py-2 text-left">Pair</th>
                  <th className="px-3 py-2 text-left">Rate</th>
                  <th className="px-3 py-2 text-left">Updated</th>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ratesList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-3 text-center text-mubah-cream/70">
                      No rates yet. Add one on the right.
                    </td>
                  </tr>
                ) : (
                  ratesList.map((r) => (
                    <tr key={r.pairId || `${r.base}-${r.target}`} className="border-t border-mubah-mid/50">
                      <td className="px-3 py-2 align-top">
                        <div className="font-semibold text-mubah-cream">
                          {r.base}  {r.target}
                        </div>
                        <div className="text-xs text-mubah-cream/70">{r.pairId}</div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="text-mubah-orange font-semibold">{r.rate?.toLocaleString() || ''}</div>
                        <div className="text-[10px] text-mubah-cream/60 mt-0.5">
                          1 {r.base} = {r.rate?.toLocaleString() || ''} {r.target}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-mubah-cream/70">
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ""}
                      </td>
                      <td className="px-3 py-2 align-top text-mubah-cream/70">{r.source || "manual"}</td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex gap-2 text-xs">
                          <button className={ghostBtn} onClick={() => startEditRate(r)}>
                            Edit
                          </button>
                          <button
                            className="rounded-full border border-red-400 px-3 py-1 text-red-200 hover:border-red-300"
                            onClick={() => deleteRatePair(r.pairId || `${r.base}-${r.target}`.toLowerCase())}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/25 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm uppercase tracking-[0.18em] text-mubah-orange">
            <span>{editingRateId ? "Edit currency" : "Add currency"}</span>
            {editingRateId && (
              <button className={ghostBtn} onClick={resetRateForm}>
                Reset
              </button>
            )}
          </div>
          <FormErrorList errors={formErrors.rate} />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Base</span>
              <input
                value={rateForm.base}
                onChange={(e) => setRateForm({ ...rateForm, base: e.target.value })}
                placeholder="USD"
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Target</span>
              <input
                value={rateForm.target}
                onChange={(e) => setRateForm({ ...rateForm, target: e.target.value })}
                placeholder="TZS"
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Rate</span>
            <input
              type="number"
              value={rateForm.rate || ""}
              onChange={(e) => setRateForm({ ...rateForm, rate: Number(e.target.value) })}
              placeholder="2600"
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
            />
            {rateForm.base && rateForm.target && rateForm.rate > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-mubah-mid/20 border border-mubah-mid/30">
                <div className="text-[10px] uppercase tracking-[0.1em] text-mubah-cream/50 mb-1">Display Preview</div>
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-mubah-cream font-medium">1 {rateForm.base.toUpperCase()}</span>
                    <span className="text-mubah-cream/50">=</span>
                    <span className="text-mubah-orange font-semibold">{rateForm.rate.toLocaleString()} {rateForm.target.toUpperCase()}</span>
                  </div>
                  <div className="text-[10px] text-mubah-cream/40">or inversely:</div>
                  <div className="flex items-center gap-2">
                    <span className="text-mubah-cream font-medium">{rateForm.rate.toLocaleString()} {rateForm.target.toUpperCase()}</span>
                    <span className="text-mubah-cream/50">=</span>
                    <span className="text-mubah-orange font-semibold">1 {rateForm.base.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Source / Note</span>
            <input
              value={rateForm.source || ""}
              onChange={(e) => setRateForm({ ...rateForm, source: e.target.value })}
              placeholder="manual / API name"
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
            />
          </label>
          <div className="flex gap-2">
            <button className={orangeBtn} onClick={saveRateForm}>
              {editingRateId ? "Update" : "Add currency"}
            </button>
            {editingRateId && (
              <button className="btn-delete" onClick={() => deleteRatePair(editingRateId)}>
                Delete
              </button>
            )}
          </div>
          <p className="text-xs text-mubah-cream/70">
            These rates power the storefront currency toggle. Base is typically USD; target is the converted currency.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Storefront default</span>
            <CustomSelect
              value={pendingDefaultCurrency ?? defaultCurrency}
              onChange={(val) => setPendingDefaultCurrency(val)}
              options={currencyChoices.map((c) => ({ value: c, label: c }))}
            />
            {pendingDefaultCurrency && pendingDefaultCurrency !== defaultCurrency && (
              <button
                className={orangeBtn}
                onClick={async () => {
                  await saveDefaultCurrency(pendingDefaultCurrency);
                  setPendingDefaultCurrency(null);
                }}
              >
                Save
              </button>
            )}
            <span className="text-xs text-mubah-cream/60">Shown first to shoppers.</span>
          </div>
          <div className="text-xs text-mubah-cream/70">
            Available currencies: {currencyChoices.length ? currencyChoices.join(", ") : "None yet"}
          </div>
        </div>
      </section>
    );
  };

  const renderProducts = () => (
    <section className="grid gap-4">
      <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap gap-2">
            <CustomSelect
              value={productCategoryFilter}
              onChange={setProductCategoryFilter}
              options={[
                { value: "all", label: "All categories" },
                ...categories.map((c) => ({ value: c.id, label: c.name }))
              ]}
              className="min-w-[160px]"
            />
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product name"
              className="min-w-[200px] flex-1 rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 text-sm"
            />
          </div>
          <button
            className={orangeBtn}
            onClick={() => {
              setEditingProduct({
                id: `new-${Date.now()}`,
                name: "New product",
                category: categories[0]?.id || "",
                subtitle: "",
                description: "",
                priceUsd: 0,
                stock: 0,
                status: "new",
                badge: "",
                fit: "",
                fabric: "",
                shipping: "",
                features: [],
                care: [],
                sizeGuide: [],
                hasSizeVariants: false,
                quickInfo: [],
                media: [],
                saleActive: false,
                salePriceUsd: 0,
              });
              setActiveStep("basics");
            }}
          >
            + Add Product
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-2">
          {filteredProducts.map((p) => (
            <article
              key={p.id}
              className="group relative overflow-hidden rounded-2xl border border-mubah-mid bg-mubah-mid/25 p-3 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex gap-3">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-mubah-mid/40">
                  {p.media && p.media[0] ? (
                    <img src={p.media[0].src} alt={p.media[0].alt || p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-mubah-cream/60">No image</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-mubah-cream">{p.name}</div>
                    <div className="flex items-center gap-2 text-sm">
                      {p.saleActive && typeof p.salePriceUsd === "number" ? (
                        <>
                          <span className="line-through text-mubah-cream/60">{formatPrice(p.priceUsd, p.priceTzs)}</span>
                          <span className="text-mubah-orange font-semibold">{formatPrice(p.salePriceUsd, p.salePriceTzs)}</span>
                        </>
                      ) : (
                        <span className="text-mubah-orange">{formatPrice(p.priceUsd, p.priceTzs)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-mubah-cream/70">{getCategoryLabel(p.category)}</div>
                  <div className="text-sm text-mubah-cream/80">{p.subtitle || p.description?.slice(0, 80) || "No description yet."}</div>
                  <div className="flex items-center gap-2 pt-1 text-xs text-mubah-cream/70">
                    <span className={`rounded-full px-2 py-0.5 ${p.stock && p.stock > 10 ? "bg-emerald-700/50" : "bg-amber-700/40"}`}>
                      {p.stock && p.stock > 10 ? "In stock" : "Low stock"}
                    </span>
                    {p.status && <span className="rounded-full bg-mubah-mid/60 px-2 py-0.5">{toTitle(p.status)}</span>}
                  </div>
                  <div className="flex gap-2 pt-2 text-sm">
                    <button
                      type="button"
                      className={ghostBtn}
                      onClick={() => {
                        setEditingProduct(p);
                        setActiveStep("basics");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => deleteProduct(p.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              {/* Reorder number circle */}
              <button
                type="button"
                onClick={() => {
                  const currentIndex = filteredProducts.findIndex(fp => fp.id === p.id);
                  if (reorderSelection?.type === "product") {
                    // Swap products
                    const newProducts = [...products];
                    const idx1 = products.findIndex(prod => prod.id === filteredProducts[reorderSelection.index].id);
                    const idx2 = products.findIndex(prod => prod.id === p.id);
                    if (idx1 !== -1 && idx2 !== -1 && idx1 !== idx2) {
                      [newProducts[idx1], newProducts[idx2]] = [newProducts[idx2], newProducts[idx1]];
                      setProducts(newProducts);
                      setMessage(`Swapped positions ${reorderSelection.index + 1}  ${currentIndex + 1}`);
                    }
                    setReorderSelection(null);
                  } else {
                    setReorderSelection({ type: "product", index: currentIndex });
                  }
                }}
                className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${reorderSelection?.type === "product" && reorderSelection?.index === filteredProducts.findIndex(fp => fp.id === p.id)
                    ? "bg-mubah-orange text-mubah-deep ring-2 ring-mubah-orange ring-offset-2 ring-offset-mubah-deep"
                    : "bg-mubah-mid/60 text-mubah-cream hover:bg-mubah-orange hover:text-mubah-deep"
                  }
                `}
                title={reorderSelection?.type === "product" ? "Click to swap with selected" : "Click to reorder"}
              >
                {filteredProducts.findIndex(fp => fp.id === p.id) + 1}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );

  const renderMedia = () => (
    <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-full bg-mubah-mid/30 p-1 text-sm">
            {["all", "image", "video"].map((f) => (
              <button
                key={f}
                onClick={() => setMediaFilter(f as "all" | "image" | "video")}
                className={`rounded-full px-3 py-1 ${mediaFilter === f ? "bg-mubah-orange text-mubah-deep" : "hover:bg-mubah-mid/40"}`}
              >
                {toTitle(f)}
              </button>
            ))}
          </div>
          <input
            value={mediaSearch}
            onChange={(e) => setMediaSearch(e.target.value)}
            placeholder="Search media"
            className="flex-1 min-w-[200px] rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 text-sm"
          />
          <button className={orangeBtn} onClick={() => fileInputRef.current?.click()}>
            Upload media
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-mubah-cream/70">
          <span className="text-mubah-orange/90">Group by category</span>
          {mediaCategoryOptions.map((cat) => (
            <button
              key={cat}
              onClick={() => setMediaCategoryFilter(cat)}
              className={`rounded-full px-3 py-1 ${mediaCategoryFilter === cat ? "bg-mubah-orange text-mubah-deep" : "hover:bg-mubah-mid/40"}`}
            >
              {cat === "all" ? "All categories" : cat === "uncategorized" ? "Unassigned" : cat}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-5">
          {groupedMediaByCategory.length === 0 ? (
            <div className="rounded-2xl border border-mubah-mid/30 bg-mubah-mid/10 p-6 text-center text-sm text-mubah-cream/70">
              No media matched these filters.
            </div>
          ) : (
            groupedMediaByCategory.map(([group, items]) => (
              <div key={group} className="space-y-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-mubah-cream/60">
                  <span className="text-[11px] text-mubah-orange/90">
                    {group === "Unassigned" ? "Unassigned media" : group}
                  </span>
                  <span className="text-[10px] text-mubah-cream/60">{items.length} items</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {items.map((m) => (
                    <div key={m.id ?? m.url} className="group relative overflow-hidden rounded-xl border border-mubah-mid bg-mubah-mid/30 shadow-sm">
                      <div className="h-28 w-full bg-mubah-mid/40">
                        {m.type === "video" ? (
                          <video src={m.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                        ) : (
                          <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="p-2 text-xs text-mubah-cream/80">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{m.name}</span>
                          <span className="rounded-full bg-mubah-mid/50 px-2 py-0.5 text-[10px] uppercase">{m.type}</span>
                        </div>
                      </div>
                      <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/50 p-2 text-xs text-white group-hover:flex">
                        <button className={orangeBtn} onClick={() => attachMediaToProduct(m)}>
                          Select
                        </button>
                        <button className="rounded-full border border-white/50 px-3 py-1" onClick={() => setSelectedMedia(m)}>
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-mubah-mid bg-mubah-mid/10 p-6 text-center text-sm text-mubah-cream/70">
          <p className="font-semibold text-mubah-cream">Drop images or videos here, or click to upload.</p>
          <p>Uploads appear at the top. We show a play badge for videos.</p>
          <button className={`${orangeBtn} mt-3`} onClick={() => fileInputRef.current?.click()}>
            Choose files
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4">
        <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Media details</div>
        {selectedMedia ? (
          <div className="mt-3 space-y-3 text-sm">
            <div className="h-40 w-full overflow-hidden rounded-xl border border-mubah-mid bg-mubah-mid/40">
              {selectedMedia.type === "video" ? (
                <div className="flex h-full items-center justify-center text-2xl"></div>
              ) : (
                <img src={selectedMedia.url} alt={selectedMedia.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div>
              <div className="font-semibold text-mubah-cream">{selectedMedia.name}</div>
              <div className="text-xs text-mubah-cream/70">
                {selectedMedia.type}  {selectedMedia.sizeMb ? `${selectedMedia.sizeMb} MB` : ""}
              </div>
              {selectedMedia.usedIn && selectedMedia.usedIn.length > 0 && (
                <div className="text-xs text-mubah-cream/70">Used in: {selectedMedia.usedIn.join(", ")}</div>
              )}
            </div>
            <div className="flex gap-2">
              <button className={orangeBtn} onClick={() => selectedMedia && attachMediaToProduct(selectedMedia)}>
                Attach to product
              </button>
              <button className={ghostBtn} onClick={() => setSelectedMedia(null)}>
                Close
              </button>
              <button
                className="rounded-full border border-red-400 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10"
                onClick={async () => {
                  if (!selectedMedia?.id) {
                    setSelectedMedia(null);
                    return;
                  }
                  setMessage("Deleting media...");
                  await fetch(`/api/admin/upload?public_id=${encodeURIComponent(selectedMedia.id)}`, {
                    method: "DELETE",
                    headers: storedToken ? { "x-admin-token": storedToken } : {},
                  });
                  setMedia((prev) => prev.filter((m) => m.id !== selectedMedia.id));
                  setSelectedMedia(null);
                  setMessage("Media deleted");
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-mubah-cream/70">Select a media item to see details.</p>
        )}
      </div>
    </section>
  );

  const renderBasicsSection = () =>
    editingProduct && (
      <div className="space-y-4 text-sm">
        <div className="space-y-3">
          <FormErrorList errors={formErrors.product} />
          <Field label="Product name">
            <textarea
              value={editingProduct.name}
              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[80px] resize-y leading-tight align-top"
              rows={2}
              placeholder="Ocean Breeze Linen"
            />
          </Field>
          <Field label="Subtitle / tagline">
            <textarea
              value={editingProduct.subtitle || ""}
              onChange={(e) => setEditingProduct({ ...editingProduct, subtitle: e.target.value })}
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[60px] resize-y leading-tight align-top"
              rows={2}
              placeholder="Lightweight linen for warm days"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Field label="Category">
              <select
                value={editingProduct.category}
                onChange={(e) => {
                  if (e.target.value === "__create_new__") {
                    const newCat = prompt("Enter new category name:");
                    if (newCat && newCat.trim()) {
                      void (async () => {
                        const createdId = await createCategoryFromName(newCat.trim());
                        if (!createdId) return;
                        setEditingProduct((prev) => (prev ? { ...prev, category: createdId } : prev));
                      })();
                    }
                  } else {
                    setEditingProduct({ ...editingProduct, category: e.target.value });
                  }
                }}
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[48px] leading-tight align-top"
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                <option value="__create_new__">+ Create New Category</option>
              </select>
            </Field>
            <Helper>Select existing category or create a new one. {!editingProduct.category && <span className="text-mubah-orange">Category is required</span>}</Helper>
          </div>
          <div className="space-y-1">
            <Field label="Status">
              <select
                value={editingProduct.status || "new"}
                onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as "new" | "featured" | "hidden" })}
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[48px] leading-tight align-top"
              >
                <option value="new">New</option>
                <option value="featured">Featured</option>
                <option value="hidden">Hidden</option>
              </select>
            </Field>
            <Helper>Hidden products are not visible in the shop.</Helper>
          </div>
          <div className="space-y-1">
            <Field label="Price (USD)">
              <div className="flex items-center gap-2 rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2">
                <span className="text-mubah-cream/60 text-xs">USD</span>
                <input
                  type="number"
                  value={editingProduct.priceUsd}
                  onChange={(e) => setEditingProduct({ ...editingProduct, priceUsd: Number(e.target.value) })}
                  className="w-full bg-transparent text-mubah-cream outline-none leading-tight align-top"
                  placeholder="0"
                />
              </div>
            </Field>
            <Field label="Price (TZS)">
              <div className="flex items-center gap-2 rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2">
                <span className="text-mubah-cream/60 text-xs">TZS</span>
                <input
                  type="number"
                  value={editingProduct.priceTzs ?? ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, priceTzs: Number(e.target.value) })}
                  className="w-full bg-transparent text-mubah-cream outline-none leading-tight align-top"
                  placeholder="0"
                />
              </div>
              <Helper>You can enter TZS manually; otherwise USD converts using the rate.</Helper>
            </Field>
          </div>
          <div className="space-y-1">
            <Field label="Stock">
              <input
                type="number"
                value={editingProduct.stock || 0}
                onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[48px] leading-tight align-top"
                placeholder="0"
              />
            </Field>
          </div>
          <div className="space-y-1">
            <Field label="Stock Status">
              <select
                value={editingProduct.stockStatus || "in_stock"}
                onChange={(e) => setEditingProduct({ ...editingProduct, stockStatus: e.target.value as AdminProduct["stockStatus"] })}
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 text-mubah-cream appearance-none cursor-pointer"
              >
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock (limited)</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="preorder">Pre-order</option>
              </select>
            </Field>
          </div>
          <div className="space-y-1">
            <Field label="Badge (e.g. Bestseller)">
              <input
                value={editingProduct.badge || ""}
                onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 leading-tight align-top"
                placeholder="BESTSELLER"
              />
            </Field>
          </div>
        </div>

        {/* SALE SECTION */}
        <div className="rounded-xl border border-mubah-mid/50 bg-mubah-mid/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.14em] text-mubah-orange">Sale & Discounts</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingProduct.saleActive || false}
                onChange={(e) => setEditingProduct({ ...editingProduct, saleActive: e.target.checked })}
                className="accent-mubah-orange w-4 h-4"
              />
              <span className="text-xs">Active</span>
            </label>
          </div>

          {editingProduct.saleActive && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Field label="Sale Type">
                  <select
                    value={editingProduct.saleType || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, saleType: e.target.value as AdminProduct["saleType"] })}
                    className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 text-mubah-cream appearance-none cursor-pointer"
                  >
                    <option value="">No specific sale</option>
                    <option value="clearance">Clearance</option>
                    <option value="blackfriday">Black Friday</option>
                    <option value="holiday">Holiday Sale</option>
                    <option value="flash">Flash Sale</option>
                    <option value="seasonal">Seasonal</option>
                  </select>
                </Field>
              </div>
              <div className="space-y-1">
                <Field label="Sale Label (shown on product)">
                  <input
                    value={editingProduct.saleLabel || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, saleLabel: e.target.value })}
                    className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
                    placeholder="e.g. BLACK FRIDAY -30%"
                  />
                </Field>
              </div>
              <div className="space-y-1">
                <Field label="Sale Price (USD)">
                  <input
                    type="number"
                    value={editingProduct.salePriceUsd || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, salePriceUsd: Number(e.target.value) || undefined })}
                    className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
                    placeholder="Discounted price"
                  />
                </Field>
              </div>
              <div className="space-y-1">
                <Field label="Sale Price (TZS)">
                  <input
                    type="number"
                    value={editingProduct.salePriceTzs || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, salePriceTzs: Number(e.target.value) || undefined })}
                    className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
                    placeholder="Discounted price in TZS"
                  />
                </Field>
              </div>
              <div className="space-y-1">
                <Field label="Sale Ends">
                  <input
                    type="datetime-local"
                    value={editingProduct.saleEndsAt || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, saleEndsAt: e.target.value })}
                    className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 text-mubah-cream"
                  />
                </Field>
                <Helper>Leave empty for no end date.</Helper>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Field label="Sale active">
              <label className="flex items-center gap-2 text-sm text-mubah-cream/80">
                <input
                  type="checkbox"
                  checked={Boolean(editingProduct.saleActive)}
                  onChange={(e) => setEditingProduct({ ...editingProduct, saleActive: e.target.checked })}
                />
                <span>Show sale banner with slashed price</span>
              </label>
            </Field>
          </div>
          <div className="space-y-1">
            <Field label="Sale price (USD)">
              <div className="flex items-center gap-2 rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2">
                <span className="text-mubah-cream/60 text-xs">USD</span>
                <input
                  type="number"
                  value={editingProduct.salePriceUsd ?? 0}
                  onChange={(e) => setEditingProduct({ ...editingProduct, salePriceUsd: Number(e.target.value || 0) })}
                  className="w-full bg-transparent text-mubah-cream outline-none leading-tight align-top"
                  placeholder="Sale price"
                  disabled={!editingProduct.saleActive}
                />
              </div>
              <Helper>When enabled, original price shows with a strike-through.</Helper>
            </Field>
            <Field label="Sale price (TZS)">
              <div className="flex items-center gap-2 rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2">
                <span className="text-mubah-cream/60 text-xs">TZS</span>
                <input
                  type="number"
                  value={editingProduct.salePriceTzs ?? ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, salePriceTzs: Number(e.target.value) })}
                  className="w-full bg-transparent text-mubah-cream outline-none leading-tight align-top"
                  placeholder="Sale price"
                  disabled={!editingProduct.saleActive}
                />
              </div>
              <Helper>Optional: manual TZS sale price; otherwise use conversion.</Helper>
            </Field>
          </div>
        </div>
      </div>
    );

  const renderStorySection = () =>
    editingProduct && (
      <div className="space-y-4 text-sm">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.14em] text-mubah-cream">Fabric & fit</div>
          <Field label="Fabric / material">
            <textarea
              value={editingProduct.fabric || ""}
              onChange={(e) => setEditingProduct({ ...editingProduct, fabric: e.target.value })}
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[80px] resize-y leading-tight align-top"
              rows={3}
              placeholder="100% Linen"
            />
          </Field>
          <Field label="Fit">
            <textarea
              value={editingProduct.fit || ""}
              onChange={(e) => setEditingProduct({ ...editingProduct, fit: e.target.value })}
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[60px] resize-y leading-tight align-top"
              rows={2}
              placeholder="Relaxed fit"
            />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.14em] text-mubah-cream">Shipping</div>
          <Field label="Shipping notes">
            <textarea
              value={editingProduct.shipping || ""}
              onChange={(e) => setEditingProduct({ ...editingProduct, shipping: e.target.value })}
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[60px] resize-y leading-tight align-top"
              rows={2}
              placeholder="Ships in 24 days"
            />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.14em] text-mubah-cream">Story / description</div>
          <Field label="Full description">
            <textarea
              value={editingProduct.description || ""}
              onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[180px] resize-y leading-tight align-top"
              rows={4}
              placeholder="Write the product story..."
            />
          </Field>
        </div>
      </div>
    );

  const renderSizeSection = () =>
    editingProduct && (
      <div className="space-y-4 text-sm">
        <div className="space-y-1">
          <Field label="Features">
            <textarea
              value={(editingProduct.features || []).join("\n")}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  features: e.target.value
                    .split("\n")
                    .map((t) => t.replace(/\r/g, ""))
                    .filter(Boolean),
                })
              }
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[140px] resize-y leading-tight align-top"
              rows={4}
              placeholder="Add one feature per line"
            />
          </Field>
          <Helper>Add one feature per line.</Helper>
        </div>

        <div className="space-y-1">
          <Field label="Care instructions">
            <textarea
              value={(editingProduct.care || []).join("\n")}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  care: e.target.value
                    .split("\n")
                    .map((t) => t.replace(/\r/g, ""))
                    .filter(Boolean),
                })
              }
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[130px] resize-y leading-tight align-top"
              rows={3}
              placeholder="One instruction per line"
            />
          </Field>
          <Helper>One instruction per line.</Helper>
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-3 rounded-xl border border-mubah-mid/60 bg-mubah-mid/20 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(editingProduct.hasSizeVariants)}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  hasSizeVariants: e.target.checked,
                })
              }
            />
            <span className="text-mubah-cream">
              Enable size options (use for trousers or fitted products). Leave off for free-size items.
            </span>
          </label>
        </div>

        <div className="space-y-1">
          <Field label="Size guide notes">
            <textarea
              value={(editingProduct.sizeGuide || []).join("\n")}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  sizeGuide: e.target.value
                    .split("\n")
                    .map((t) => t.replace(/\r/g, ""))
                    .filter(Boolean),
                })
              }
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[120px] resize-y leading-tight align-top"
              rows={2}
              disabled={!editingProduct.hasSizeVariants}
              placeholder="Short lines under the size guide"
            />
          </Field>
          <Helper>
            {editingProduct.hasSizeVariants
              ? "Short lines that appear under the size guide."
              : "Size options are disabled. Product will be treated as Free Size on storefront."}
          </Helper>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.14em] text-mubah-cream">Quick info</div>
          <Helper>Use short label/value pairs (e.g. Fabric: 100% Linen).</Helper>
          <div className="space-y-2">
            {(editingProduct.quickInfo || []).map((q, idx) => (
              <QuickInfoRow
                key={`${q.label}-${idx}`}
                label={q.label}
                value={q.value}
                onChange={(next) => {
                  const updated = [...(editingProduct.quickInfo || [])];
                  updated[idx] = next;
                  setEditingProduct({ ...editingProduct, quickInfo: updated });
                }}
                onDelete={() => {
                  const updated = [...(editingProduct.quickInfo || [])];
                  updated.splice(idx, 1);
                  setEditingProduct({ ...editingProduct, quickInfo: updated });
                }}
              />
            ))}
            <button
              className="text-sm text-mubah-orange hover:text-mubah-orange-alt"
              onClick={() =>
                setEditingProduct({
                  ...editingProduct,
                  quickInfo: [...(editingProduct.quickInfo || []), { label: "", value: "" }],
                })
              }
            >
              + Add row
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <Field label="Measurement images (one per line)">
            <textarea
              value={(editingProduct.measurementImages || []).join("\n")}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  measurementImages: e.target.value
                    .split("\n")
                    .map((t) => t.replace(/\r/g, ""))
                    .filter(Boolean),
                })
              }
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-3 min-h-[100px] resize-y leading-tight align-top"
              rows={3}
              placeholder="/measurements/top1.png"
            />
          </Field>
          <Helper>These replace the default measurement diagrams on the PDP if provided.</Helper>
        </div>

      </div>
    );

  const renderMediaSection = () =>
    editingProduct && (
      <div className="space-y-3 text-sm">
        <div>
          <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Media</div>
          <p className="text-xs text-mubah-cream/70">Choose the images and videos for this product.</p>
        </div>
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.14em] text-mubah-cream/80">Main media preview</div>
          <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/40 p-3">
            <div className="relative min-h-[220px] overflow-hidden rounded-xl bg-mubah-mid/50">
              {editingProduct.media && editingProduct.media[productMediaCarouselIndex] ? (
                editingProduct.media[productMediaCarouselIndex].type === "video" ? (
                  <video
                    src={editingProduct.media[productMediaCarouselIndex].src}
                    className="h-full w-full object-cover"
                    controls
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={editingProduct.media[productMediaCarouselIndex].src}
                    alt={editingProduct.media[productMediaCarouselIndex].alt || "Main"}
                    className="h-full w-full object-cover"
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-mubah-cream/70">
                  No image
                </div>
              )}
              {(editingProduct.media?.length || 0) > 1 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-mubah-deep/80 px-3 py-2 text-sm hover:bg-mubah-mid"
                    onClick={() =>
                      setProductMediaCarouselIndex((prev) =>
                        prev === 0 ? (editingProduct.media?.length || 1) - 1 : prev - 1,
                      )
                    }
                    title="Previous media"
                  >
                    {"<"}
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-mubah-deep/80 px-3 py-2 text-sm hover:bg-mubah-mid"
                    onClick={() =>
                      setProductMediaCarouselIndex((prev) =>
                        prev === (editingProduct.media?.length || 1) - 1 ? 0 : prev + 1,
                      )
                    }
                    title="Next media"
                  >
                    {">"}
                  </button>
                </>
              )}
            </div>
            <div className="mt-2 text-xs text-mubah-cream/70">
              {editingProduct.media && editingProduct.media[productMediaCarouselIndex]
                ? `Showing ${productMediaCarouselIndex + 1} of ${editingProduct.media.length}`
                : "Set as main image"}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.14em] text-mubah-cream/80">Gallery</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(editingProduct.media || []).map((m, idx) => (
              <div key={m.id || m.src} className="space-y-2">
                <div
                  className={`relative aspect-[4/5] w-full overflow-hidden rounded-xl border bg-mubah-mid/40 transition duration-200 hover:border-mubah-orange/50 ${
                    idx === productMediaCarouselIndex ? "border-mubah-orange" : "border-mubah-mid"
                  }`}
                  onClick={() => setProductMediaCarouselIndex(idx)}
                >
                  {/* Position number badge */}
                  <div className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-mubah-orange text-mubah-deep text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                  {m.type === "video" ? (
                    <video
                      src={m.src}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img src={m.src} alt={m.alt || "media"} className="h-full w-full object-cover" />
                  )}
                  <div className="absolute left-1 top-1 flex gap-1">
                    <button
                      className="rounded-full bg-mubah-deep/80 px-2 py-0.5 text-[10px] hover:bg-mubah-orange hover:text-mubah-deep"
                      onClick={() => {
                        const next = [...(editingProduct.media || [])];
                        const [main] = next.splice(idx, 1);
                        next.unshift(main);
                        setProductMediaCarouselIndex(0);
                        setEditingProduct({ ...editingProduct, media: next });
                      }}
                    >
                      Main
                    </button>
                    <button
                      className="rounded-full bg-red-900/80 px-2 py-0.5 text-[10px] text-red-100 hover:bg-red-700"
                      onClick={() => {
                        const next = [...(editingProduct.media || [])];
                        next.splice(idx, 1);
                        if (productMediaCarouselIndex >= next.length) {
                          setProductMediaCarouselIndex(Math.max(0, next.length - 1));
                        }
                        setEditingProduct({ ...editingProduct, media: next });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  {/* Reorder arrows - bottom */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                    {idx > 0 && (
                      <button
                        className="rounded-full bg-mubah-deep/80 w-7 h-7 text-sm hover:bg-mubah-mid"
                        title="Move left"
                        onClick={() => {
                          const next = [...(editingProduct.media || [])];
                          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                          setEditingProduct({ ...editingProduct, media: next });
                        }}
                      ></button>
                    )}
                    {idx < (editingProduct.media || []).length - 1 && (
                      <button
                        className="rounded-full bg-mubah-deep/80 w-7 h-7 text-sm hover:bg-mubah-mid"
                        title="Move right"
                        onClick={() => {
                          const next = [...(editingProduct.media || [])];
                          [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                          setEditingProduct({ ...editingProduct, media: next });
                        }}
                      ></button>
                    )}
                  </div>
                </div>
                <input
                  value={m.alt || ""}
                  onChange={(e) => {
                    const next = [...(editingProduct.media || [])];
                    next[idx] = { ...m, alt: e.target.value };
                    setEditingProduct({ ...editingProduct, media: next });
                  }}
                  placeholder="Alt text / description"
                  className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 text-xs"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <label className={`${orangeBtn} relative cursor-pointer select-none inline-flex items-center`}>
              Upload images / videos
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  onUploadProductMedia(e.target.files);
                  if (e.target) e.target.value = "";
                }}
              />
            </label>
          </div>
          <Helper>Tip: Add at least 3 photos/videos for each product.</Helper>
        </div>
      </div>
    );

  const renderVisibilitySection = () =>
    editingProduct && (
      <div className="space-y-4 text-sm">
        <div className="rounded-xl border border-mubah-mid/50 bg-mubah-mid/10 p-4 space-y-3">
          <div className="text-xs uppercase tracking-[0.14em] text-mubah-orange">Display Options - Show/Hide Sections</div>
          <p className="text-xs text-mubah-cream/60">Only sections currently used on the product page are shown here.</p>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingProduct.showFbt !== false}
                onChange={(e) => setEditingProduct({ ...editingProduct, showFbt: e.target.checked })}
                className="accent-mubah-orange w-4 h-4"
              />
              <span className="text-sm text-mubah-cream">Frequently Bought Together</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingProduct.showStyleWith !== false}
                onChange={(e) => setEditingProduct({ ...editingProduct, showStyleWith: e.target.checked })}
                className="accent-mubah-orange w-4 h-4"
              />
              <span className="text-sm text-mubah-cream">Style With</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingProduct.showAlsoPicked !== false}
                onChange={(e) => setEditingProduct({ ...editingProduct, showAlsoPicked: e.target.checked })}
                className="accent-mubah-orange w-4 h-4"
              />
              <span className="text-sm text-mubah-cream">Also Picked</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingProduct.showDescription !== false}
                onChange={(e) => setEditingProduct({ ...editingProduct, showDescription: e.target.checked })}
                className="accent-mubah-orange w-4 h-4"
              />
              <span className="text-sm text-mubah-cream">Description</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingProduct.showFabricCare !== false}
                onChange={(e) => setEditingProduct({ ...editingProduct, showFabricCare: e.target.checked })}
                className="accent-mubah-orange w-4 h-4"
              />
              <span className="text-sm text-mubah-cream">Fabric & Care</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingProduct.showFitSize !== false}
                onChange={(e) => setEditingProduct({ ...editingProduct, showFitSize: e.target.checked })}
                className="accent-mubah-orange w-4 h-4"
              />
              <span className="text-sm text-mubah-cream">Fit & Size</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingProduct.showShippingReturns !== false}
                onChange={(e) => setEditingProduct({ ...editingProduct, showShippingReturns: e.target.checked })}
                className="accent-mubah-orange w-4 h-4"
              />
              <span className="text-sm text-mubah-cream">Shipping & Returns</span>
            </label>
          </div>
        </div>
      </div>
    );

  // Relations step: Related products + product reviews
  const renderRelationsStep = () =>
    editingProduct && (
      <div className="space-y-6">
        {/* Product Picker Component (reusable for all three sections) */}
        {(["fbt", "styleWith", "alsoPicked"] as const).map((sectionKey) => {
          const labels = {
            fbt: "Frequently Bought Together",
            styleWith: "Style It With",
            alsoPicked: "Also Picked",
          };
          const currentItems = editingProduct[sectionKey] || [];

          return (
            <div key={sectionKey} className="rounded-xl border border-mubah-mid bg-mubah-mid/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.14em] text-mubah-orange">{labels[sectionKey]}</div>
                <span className="text-[10px] text-mubah-cream/50">{currentItems.length} items</span>
              </div>

              {/* Current items */}
              <div className="flex flex-wrap gap-2">
                {currentItems.map((item, idx) => (
                  <div key={`${sectionKey}-${idx}`} className="flex items-center gap-2 rounded-lg border border-mubah-mid/40 bg-mubah-mid/10 p-1.5">
                    {item.image && <img src={item.image} alt={item.name} className="h-10 w-10 rounded object-cover" />}
                    <div className="text-xs">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-mubah-cream/50">${item.priceUsd}</div>
                    </div>
                    <div className="flex gap-1">
                      {idx > 0 && (
                        <button
                          className="rounded bg-mubah-mid/50 w-5 h-5 text-[10px]"
                          onClick={() => {
                            const next = [...currentItems];
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            setEditingProduct({ ...editingProduct, [sectionKey]: next });
                          }}
                        ></button>
                      )}
                      {idx < currentItems.length - 1 && (
                        <button
                          className="rounded bg-mubah-mid/50 w-5 h-5 text-[10px]"
                          onClick={() => {
                            const next = [...currentItems];
                            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                            setEditingProduct({ ...editingProduct, [sectionKey]: next });
                          }}
                        ></button>
                      )}
                      <button
                        className="rounded bg-red-500/30 w-5 h-5 text-[10px] text-red-300"
                        onClick={() => {
                          const next = currentItems.filter((_, i) => i !== idx);
                          setEditingProduct({ ...editingProduct, [sectionKey]: next });
                        }}
                      ></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add from existing products */}
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) return;
                    const prod = products.find((p) => p.id === selectedId);
                    if (!prod) return;
                    const newItem = {
                      id: prod.id,
                      name: prod.name,
                      priceUsd: prod.priceUsd,
                      image: prod.media?.[0]?.src || prod.fallbackImage || "",
                    };
                    setEditingProduct({ ...editingProduct, [sectionKey]: [...currentItems, newItem] });
                    e.target.value = "";
                  }}
                  className="rounded-lg border border-mubah-mid bg-mubah-deep text-mubah-cream px-3 py-2 text-sm flex-1 min-w-[200px] appearance-none cursor-pointer"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23D4A574' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
                >
                  <option value="">+ Add from catalog...</option>
                  {categories.map((cat) => (
                    <optgroup key={cat.id} label={cat.name}>
                      {products
                        .filter((p) => p.category === cat.id && p.id !== editingProduct.id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>{p.name} - ${p.priceUsd}</option>
                        ))
                      }
                    </optgroup>
                  ))}
                </select>
                <span className="text-[10px] text-mubah-cream/40">or</span>
                <button
                  className="rounded bg-mubah-mid/50 px-2 py-1.5 text-[10px] hover:bg-mubah-mid"
                  onClick={() => {
                    const name = prompt("Product name:");
                    if (!name) return;
                    const price = parseFloat(prompt("Price USD:") || "0");
                    const image = prompt("Image URL:") || "";
                    setEditingProduct({ ...editingProduct, [sectionKey]: [...currentItems, { name, priceUsd: price, image }] });
                  }}
                >
                  + Add custom
                </button>
              </div>
            </div>
          );
        })}

        {/* Product-specific Reviews */}
        <div className="rounded-xl border border-mubah-mid bg-mubah-mid/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.14em] text-mubah-orange">Product Reviews</div>
            <button
              className="rounded bg-mubah-orange/20 px-2 py-1 text-[10px] text-mubah-orange hover:bg-mubah-orange/30"
              onClick={() => {
                const newReview = {
                  author: "",
                  rating: 5,
                  text: "",
                  verified: false,
                  createdAt: new Date().toISOString(),
                };
                setEditingProduct({
                  ...editingProduct,
                  productReviews: [...(editingProduct.productReviews || []), newReview],
                });
              }}
            >
              + Add Review
            </button>
          </div>
          <p className="text-[10px] text-mubah-cream/50">
            Add reviews from customers who purchased this product. You can request reviews after orders are delivered.
          </p>

          <div className="space-y-3">
            {(editingProduct.productReviews || []).map((review, idx) => (
              <div key={idx} className="rounded-lg border border-mubah-mid/40 bg-mubah-mid/10 p-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <input
                    value={review.author}
                    onChange={(e) => {
                      const next = [...(editingProduct.productReviews || [])];
                      next[idx] = { ...review, author: e.target.value };
                      setEditingProduct({ ...editingProduct, productReviews: next });
                    }}
                    placeholder="Customer name"
                    className="flex-1 min-w-[120px] rounded border border-mubah-mid bg-mubah-mid/30 px-2 py-1 text-xs"
                  />
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          const next = [...(editingProduct.productReviews || [])];
                          next[idx] = { ...review, rating: n };
                          setEditingProduct({ ...editingProduct, productReviews: next });
                        }}
                        className={`text-lg ${n <= review.rating ? "text-mubah-orange" : "text-mubah-mid"}`}
                      ></button>
                    ))}
                  </div>
                  <label className="flex items-center gap-1 text-[10px]">
                    <input
                      type="checkbox"
                      checked={review.verified || false}
                      onChange={(e) => {
                        const next = [...(editingProduct.productReviews || [])];
                        next[idx] = { ...review, verified: e.target.checked };
                        setEditingProduct({ ...editingProduct, productReviews: next });
                      }}
                    />
                    Verified
                  </label>
                </div>
                <textarea
                  value={review.text}
                  onChange={(e) => {
                    const next = [...(editingProduct.productReviews || [])];
                    next[idx] = { ...review, text: e.target.value };
                    setEditingProduct({ ...editingProduct, productReviews: next });
                  }}
                  placeholder="Review text..."
                  rows={2}
                  className="w-full rounded border border-mubah-mid bg-mubah-mid/30 px-2 py-1 text-xs resize-y min-h-[60px]"
                />

                {/* Review Media Gallery */}
                <div className="space-y-1">
                  <div className="text-[10px] text-mubah-cream/60">Photos/Videos</div>
                  <div className="flex flex-wrap gap-2">
                    {(review.media || []).map((m, mIdx) => (
                      <div key={mIdx} className="relative group h-14 w-14 rounded overflow-hidden bg-mubah-mid/30">
                        {m.type === "video" ? (
                          <div className="h-full w-full flex items-center justify-center text-lg"></div>
                        ) : (
                          <img src={m.url} alt="" className="h-full w-full object-cover" />
                        )}
                        <button
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-300 text-xs"
                          onClick={() => {
                            const next = [...(editingProduct.productReviews || [])];
                            const newMedia = (review.media || []).filter((_, i) => i !== mIdx);
                            next[idx] = { ...review, media: newMedia };
                            setEditingProduct({ ...editingProduct, productReviews: next });
                          }}
                        ></button>
                      </div>
                    ))}
                    <button
                      className="h-14 w-14 rounded border border-dashed border-mubah-mid/60 flex items-center justify-center text-mubah-cream/50 hover:border-mubah-orange hover:text-mubah-orange text-lg"
                      onClick={() => {
                        triggerAssetUpload((url) => {
                          const next = [...(editingProduct.productReviews || [])];
                          const type = /\.(mp4|mov|webm|m4v)$/i.test(url) ? "video" as const : "image" as const;
                          const newMedia = [...(review.media || []), { url, type }];
                          next[idx] = { ...review, media: newMedia };
                          setEditingProduct({ ...editingProduct, productReviews: next });
                        });
                      }}
                    >+</button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    className="rounded bg-red-500/30 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/50"
                    onClick={() => {
                      const next = (editingProduct.productReviews || []).filter((_, i) => i !== idx);
                      setEditingProduct({ ...editingProduct, productReviews: next });
                    }}
                  >
                    Remove Review
                  </button>
                </div>
              </div>
            ))}
            {(editingProduct.productReviews || []).length === 0 && (
              <p className="text-mubah-cream/40 text-center py-4 text-sm">No reviews for this product yet.</p>
            )}
          </div>
        </div>
      </div>
    );

  const renderOrders = () => (
    <section className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4">
      <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Orders</div>
      {orders.length === 0 ? (
        <p className="mt-3 text-sm text-mubah-cream/70">No orders yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-mubah-mid bg-mubah-mid/25 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-mubah-cream">Order {o.id}</div>
                  <div className="text-xs text-mubah-cream/70">
                    {o.contact?.name || "No name"}  {o.contact?.email || ""}
                  </div>
                  <div className="text-xs text-mubah-cream/60 mt-1">
                    {o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}  Placed {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-mubah-orange font-semibold">
                    {o.currency} {o.total}
                  </div>
                  <div className="text-xs text-mubah-cream/60 mt-1">
                    Payment: <span className={`font-medium ${o.paymentStatus === 'paid' ? 'text-green-400' : o.paymentStatus === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {o.paymentStatus || 'pending'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-mubah-cream/70">Status:</label>
                  <select
                    value={o.status}
                    onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                    className="rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-1.5 text-xs font-medium text-mubah-cream"
                  >
                    {orderStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {toTitle(status)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
                  onClick={() => updateOrderStatus(o.id, "processing")}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="btn-delete"
                  onClick={() => updateOrderStatus(o.id, "cancelled")}
                >
                  Decline
                </button>
                {o.trackingNumber && (
                  <span className="text-xs text-purple-400">
                     Tracking: {o.trackingNumber}
                  </span>
                )}
                {o.shippedAt && (
                  <span className="text-xs text-green-400">
                     Shipped {new Date(o.shippedAt).toLocaleDateString()}
                  </span>
                )}
                {o.deliveredAt && (
                  <span className="text-xs text-green-400">
                     Delivered {new Date(o.deliveredAt).toLocaleDateString()}
                  </span>
                )}
                <button className="btn-delete ml-auto" onClick={() => deleteOrder(o.id)}>
                  Delete
                </button>
              </div>
              {/* Tracking Number Input */}
              {(o.status === 'processing' || o.status === 'shipped') && (
                <div className="mt-3 pt-3 border-t border-mubah-mid/50">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add tracking number"
                      defaultValue={o.trackingNumber || ''}
                      onBlur={async (e) => {
                        const trackingNumber = e.target.value.trim();
                        if (trackingNumber && trackingNumber !== o.trackingNumber) {
                          try {
                            const res = await fetch('/api/admin/orders/tracking', {
                              method: 'PATCH',
                              headers: { 
                                'Content-Type': 'application/json',
                                ...(storedToken ? { 'x-admin-token': storedToken } : {})
                              },
                              body: JSON.stringify({ orderId: o.id, trackingNumber }),
                            });
                            if (res.ok) {
                              setMessage('Tracking number added');
                              await loadOrders();
                            }
                          } catch (err) {
                            console.error('Failed to add tracking:', err);
                          }
                        }
                      }}
                      className="flex-1 rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-1.5 text-xs text-mubah-cream"
                    />
                  </div>
                </div>
              )}
              {/* Order Items */}
              {o.items && o.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-mubah-mid/50">
                  <div className="text-xs text-mubah-cream/70 mb-2">Order Items:</div>
                  <div className="space-y-1.5">
                    {o.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-mubah-cream/80">
                          {item.name} {item.size && `(${item.size})`}  {item.quantity}
                        </span>
                        <span className="text-mubah-cream/70">
                          {formatOrderLineTotal(o, item)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderForms = () => {
    const statusOptions = ["stored", "checked", "declined"];
    const renderSummary = (summary?: string) => {
      if (!summary) return <span className="text-mubah-cream/60">No summary</span>;
      return (
        <div className="space-y-1">
          {summary
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line, idx) => {
              const match = line.match(/^([^:]+):\s*(.*)$/);
              if (match) {
                return (
                  <div key={`${line}-${idx}`} className="text-sm leading-snug text-mubah-cream/85">
                    <span className="font-semibold text-mubah-cream">{match[1]}:</span>{" "}
                    <span className="text-mubah-cream/80">{match[2]}</span>
                  </div>
                );
              }
              return (
                <div key={`${line}-${idx}`} className="text-sm leading-snug text-mubah-cream/80">
                  {line}
                </div>
              );
            })}
        </div>
      );
    };
    return (
      <section className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Form submissions</div>
          <div className="flex items-center gap-2">
            <button className={ghostBtn} onClick={loadForms}>
              Refresh
            </button>
            <span className="text-xs text-mubah-cream/70">{formsLoading ? "Loading..." : `${formSubmissions.length} rows`}</span>
          </div>
        </div>
        {formsLoading ? (
          <p className="mt-3 text-sm text-mubah-cream/70">Loading submissions...</p>
        ) : formSubmissions.length === 0 ? (
          <p className="mt-3 text-sm text-mubah-cream/70">No submissions found. Ensure Google Sheets env vars are set and the sheet has data.</p>
        ) : (
          <div className="mt-3 overflow-auto rounded-xl border border-mubah-mid bg-mubah-mid/30">
            <table className="min-w-[1024px] w-full text-sm text-mubah-cream/90">
              <thead className="bg-mubah-mid/40 text-xs uppercase tracking-[0.12em] text-mubah-cream/70">
                <tr>
                  <th className="px-4 py-3 text-left w-[35%]">Summary</th>
                  <th className="px-4 py-3 text-left w-[15%]">Created</th>
                  <th className="px-4 py-3 text-left w-[12%]">Channel</th>
                  <th className="px-4 py-3 text-left w-[12%]">Type</th>
                  <th className="px-4 py-3 text-left w-[13%]">Status</th>
                  <th className="px-4 py-3 text-left w-[13%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {formSubmissions.map((row) => (
                  <tr key={row.id} className="border-t border-mubah-mid/50 hover:bg-mubah-mid/20 transition">
                    <td className="px-4 py-3 align-top text-mubah-cream/85">{renderSummary(row.summary)}</td>
                    <td className="px-4 py-3 align-top text-mubah-cream/70 text-xs">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}
                    </td>
                    <td className="px-4 py-3 align-top text-mubah-cream/70">{row.channel || ""}</td>
                    <td className="px-4 py-3 align-top text-mubah-cream/70">{row.type || ""}</td>
                    <td className="px-4 py-3 align-top">
                      <select
                        value={row.status || "stored"}
                        onChange={async (e) => {
                          const status = e.target.value;
                          await fetch("/api/admin/forms", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
                            body: JSON.stringify({ id: row.id, status }),
                          });
                          setFormSubmissions((prev) =>
                            prev.map((f) => (f.id === row.id ? { ...f, status } : f)),
                          );
                          setMessage("Status updated");
                        }}
                        className="rounded-lg border border-mubah-mid bg-mubah-mid/40 px-2 py-1 text-sm"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex gap-2">
                        <button
                          className="text-xs text-mubah-orange hover:text-mubah-orange-alt"
                          onClick={async () => {
                            const ok = confirm("Delete this submission?");
                            if (!ok) return;
                            await fetch(`/api/admin/forms?id=${row.id}`, {
                              method: "DELETE",
                              headers: storedToken ? { "x-admin-token": storedToken } : {},
                            });
                            setFormSubmissions((prev) => prev.filter((f) => f.id !== row.id));
                            setMessage("Submission deleted");
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  };

  // [REMOVED] Site Assets section - Features distributed to dedicated sidebar sections
  
  // Events section
  const renderEvents = () => {
    const saveEvent = async (event: Event) => {
      const method = event.id.startsWith("new-") ? "POST" : "PUT";
      const res = await fetch("/api/admin/events", {
        method,
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify(event),
      });
      if (res.ok) {
        setMessage("Event saved");
        setEditingEvent(null);
        loadEvents();
      } else {
        setMessage("Failed to save event");
      }
    };

    const deleteEvent = async (id: string) => {
      const res = await fetch(`/api/admin/events?id=${id}&permanent=true`, {
        method: "DELETE",
        headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
      });
      if (res.ok) {
        setMessage("Event deleted");
        loadEvents();
      }
    };

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Events</h2>
          <button
            className={orangeBtn}
            onClick={() => setEditingEvent({
              id: `new-${Date.now()}`,
              title: "",
              description: "",
              date: new Date().toISOString().split("T")[0],
              location: "",
              status: "upcoming",
            })}
          >
            + New Event
          </button>
        </div>

        {editingEvent && (
          <div className="rounded-xl border border-mubah-orange bg-mubah-mid/20 p-3 sm:p-4 space-y-3">
            <Field label="Title">
              <input
                value={editingEvent.title}
                onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2.5 sm:py-2 text-base sm:text-sm min-h-[44px] touch-manipulation"
                placeholder="Enter event title"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date & Time">
                <input
                  type="datetime-local"
                  value={editingEvent.date?.split(".")[0] || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2.5 sm:py-2 text-base sm:text-sm min-h-[44px] touch-manipulation"
                />
              </Field>
              <Field label="Location">
                <input
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2.5 sm:py-2 text-base sm:text-sm min-h-[44px] touch-manipulation"
                  placeholder="Venue name & address"
                />
              </Field>
            </div>
            <Field label="Short Description (Preview)">
              <textarea
                value={editingEvent.shortDescription || ""}
                onChange={(e) => setEditingEvent({ ...editingEvent, shortDescription: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2.5 sm:py-2 text-base sm:text-sm"
                placeholder="Brief description shown in event cards (optional)"
              />
            </Field>
            <Field label="Full Description">
              <textarea
                value={editingEvent.description}
                onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2.5 sm:py-2 text-base sm:text-sm"
                placeholder="Detailed event description"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Registration/Info Link">
                <input
                  value={editingEvent.link || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, link: e.target.value })}
                  className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2.5 sm:py-2 text-base sm:text-sm min-h-[44px] touch-manipulation"
                  placeholder="https://..."
                />
              </Field>
              <Field label="Status">
                <select
                  value={editingEvent.status}
                  onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as Event["status"] })}
                  className="w-full rounded-lg border border-mubah-mid bg-mubah-deep text-mubah-cream px-3 py-2.5 sm:py-2 text-base sm:text-sm appearance-none cursor-pointer min-h-[44px] touch-manipulation"
                >
                  <option value="draft">Draft</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="past">Past</option>
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-2 cursor-pointer touch-manipulation py-1">
              <input
                type="checkbox"
                checked={editingEvent.featured || false}
                onChange={(e) => setEditingEvent({ ...editingEvent, featured: e.target.checked })}
                className="accent-mubah-orange w-5 h-5"
              />
              <span className="text-sm">Featured Event (show with badge)</span>
            </label>

            {/* Event Media Gallery */}
            <Field label="Event Media (Images & Videos)">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    ref={(el) => { if (el && !el.dataset.eventMedia) { el.dataset.eventMedia = "true"; } }}
                    accept="image/*,video/*"
                    capture="environment"
                    multiple
                    className="sr-only"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      
                      setMessage("Uploading media...");
                      const uploadedUrls: string[] = [];
                      
                      for (const file of files) {
                        const formData = new FormData();
                        formData.append("file", file);
                        
                        try {
                          const res = await fetch("/api/admin/upload", {
                            method: "POST",
                            headers: storedToken ? { "x-admin-token": storedToken } : {},
                            body: formData,
                          });
                          
                          if (res.ok) {
                            const data = await res.json();
                            uploadedUrls.push(data.url);
                          }
                        } catch (error) {
                          console.error("Upload failed:", error);
                        }
                      }
                      
                      if (uploadedUrls.length > 0) {
                        const newMediaItems = uploadedUrls.map((url, index) => ({
                          url,
                          type: (files[index].type?.startsWith("video/") ? "video" : "image") as "image" | "video"
                        }));
                        const updatedMedia = [...(editingEvent.media || []), ...newMediaItems];
                        setEditingEvent({
                          ...editingEvent,
                          media: updatedMedia,
                          posterImage: editingEvent.posterImage || updatedMedia[0]?.url,
                        });
                        setMessage(`${uploadedUrls.length} file(s) uploaded successfully`);
                      }
                      e.target.value = "";
                    }}
                  />
                  <button
                    className={`${ghostBtn} flex-1 sm:flex-none`}
                    onClick={() => {
                      const input = document.querySelector('input[data-event-media="true"]') as HTMLInputElement;
                      if (input) input.click();
                    }}
                  >
                     Take Photo/Video
                  </button>
                  <button
                    className={`${ghostBtn} flex-1 sm:flex-none`}
                    onClick={() => {
                      const input = document.querySelector('input[data-event-media="true"]') as HTMLInputElement;
                      if (input) {
                        input.removeAttribute("capture");
                        input.click();
                        setTimeout(() => input.setAttribute("capture", "environment"), 100);
                      }
                    }}
                  >
                     Choose from Library
                  </button>
                  <button
                    className={`${ghostBtn} flex-1 sm:flex-none`}
                    onClick={() => {
                      triggerAssetUpload((url) => {
                        const newMedia = { url, type: "image" as const };
                        const updatedMedia = [...(editingEvent.media || []), newMedia];
                        setEditingEvent({
                          ...editingEvent,
                          media: updatedMedia,
                          posterImage: editingEvent.posterImage || updatedMedia[0]?.url,
                        });
                      });
                    }}
                  >
                     Add URL
                  </button>
                </div>
                <div className="rounded-lg bg-mubah-orange/10 border border-mubah-orange/30 px-3 py-2">
                  <p className="text-xs text-mubah-orange/90">
                    <strong> Take Photo/Video:</strong> Capture new media using device camera (iOS/Android)<br/>
                    <strong> Choose from Library:</strong> Select existing photos/videos from your gallery<br/>
                    <strong> Add URL:</strong> Paste a URL to an image/video hosted elsewhere<br/>
                    <strong>Set as Poster:</strong> Click "Set Poster" on any thumbnail to make it the main event image
                  </p>
                </div>
                {editingEvent.media && editingEvent.media.length > 0 && (
                  <>
                    <div className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70 mt-4">
                      Uploaded Media Gallery ({editingEvent.media.length})
                    </div>
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {editingEvent.media.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`group relative aspect-video overflow-hidden rounded-lg border transition-all touch-manipulation ${
                            editingEvent.posterImage === item.url 
                              ? 'border-mubah-orange border-2 ring-2 ring-mubah-orange/50 shadow-lg' 
                              : 'border-mubah-mid'
                          }`}
                        >
                        {/* Main image */}
                        {item.type === "video" ? (
                          <video src={item.url} className="h-full w-full object-cover" />
                        ) : (
                          <img src={item.url} alt="" className="h-full w-full object-cover" />
                        )}
                        
                        {/* Top-right: Set as Poster button */}
                        {editingEvent.posterImage === item.url ? (
                          <div className="absolute top-2 right-2 rounded-full bg-mubah-orange px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold text-mubah-deep shadow-lg z-10">
                             POSTER
                          </div>
                        ) : (
                          <button
                            className="absolute top-2 right-2 rounded-full bg-mubah-deep/80 hover:bg-mubah-orange active:bg-mubah-orange px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-semibold text-mubah-cream hover:text-mubah-deep transition z-10 min-h-[32px] sm:min-h-auto"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingEvent({ ...editingEvent, posterImage: item.url });
                            }}
                            title="Set as poster"
                          >
                            Set Poster
                          </button>
                        )}
                        
                        {/* Bottom: Action buttons - always visible on mobile, hover on desktop */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition p-2 flex items-center justify-center gap-2 z-10">
                          <button
                            className="rounded bg-mubah-orange px-2 py-1.5 text-xs text-mubah-deep font-semibold hover:bg-mubah-orange/90 active:bg-mubah-orange/80 disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] min-w-[36px] touch-manipulation"
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newMedia = [...(editingEvent.media || [])];
                              [newMedia[idx], newMedia[idx - 1]] = [newMedia[idx - 1], newMedia[idx]];
                              setEditingEvent({ ...editingEvent, media: newMedia });
                            }}
                            title="Move left"
                          >
                            
                          </button>
                          <button
                            className="rounded bg-mubah-orange px-2 py-1.5 text-xs text-mubah-deep font-semibold hover:bg-mubah-orange/90 active:bg-mubah-orange/80 disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] min-w-[36px] touch-manipulation"
                            disabled={idx === (editingEvent.media || []).length - 1}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newMedia = [...(editingEvent.media || [])];
                              [newMedia[idx], newMedia[idx + 1]] = [newMedia[idx + 1], newMedia[idx]];
                              setEditingEvent({ ...editingEvent, media: newMedia });
                            }}
                            title="Move right"
                          >
                            
                          </button>
                          <button
                            className="rounded bg-red-500 px-2 py-1.5 text-xs text-white font-semibold hover:bg-red-600 active:bg-red-700 min-h-[36px] min-w-[36px] touch-manipulation"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newMedia = (editingEvent.media || []).filter((_, i) => i !== idx);
                              setEditingEvent({ ...editingEvent, media: newMedia });
                            }}
                            title="Delete"
                          >
                            
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  </>
                )}
              </div>
            </Field>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button className={`${orangeBtn} flex-1 sm:flex-none`} onClick={() => saveEvent(editingEvent)}>
                 Save Event
              </button>
              <button className={`${ghostBtn} flex-1 sm:flex-none`} onClick={() => setEditingEvent(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {events.map((event, idx) => (
            <div key={`${event.id}-${idx}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border border-mubah-mid bg-mubah-mid/10 p-3 touch-manipulation">
              {(event.posterImage || event.image) && (
                <img 
                  src={event.posterImage || event.image} 
                  alt="" 
                  className="h-16 w-16 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0" 
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm sm:text-base truncate">{event.title}</div>
                <div className="text-xs text-mubah-cream/60">
                  {new Date(event.date).toLocaleDateString()}  {event.location}
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className={`rounded-full px-2 py-0.5 text-[10px] whitespace-nowrap ${
                  event.status === "upcoming" ? "bg-green-500/20 text-green-400" :
                  event.status === "ongoing" ? "bg-blue-500/20 text-blue-400" :
                  event.status === "past" ? "bg-gray-500/20 text-gray-400" : "bg-amber-500/20 text-amber-400"
                }`}>
                  {event.status}
                </span>
                {event.featured && (
                  <span className="rounded-full bg-mubah-orange/20 text-mubah-orange px-2 py-0.5 text-[10px] whitespace-nowrap">
                     Featured
                  </span>
                )}
                <button 
                  className={`${ghostBtn} px-3 py-1.5 text-xs flex-1 sm:flex-none`} 
                  onClick={() => setEditingEvent(event)}
                >
                  Edit
                </button>
                <button 
                  className="text-red-400 text-xs hover:text-red-300 px-2 py-1.5 min-h-[36px] touch-manipulation" 
                  onClick={() => deleteEvent(event.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-mubah-cream/60 py-4 text-center">No events yet.</p>}
        </div>
      </section>
    );
  };

  // Blog section
  const renderBlog = () => {
    const savePost = async (post: BlogPost) => {
      const isNew = post.id.startsWith("new-");
      const method = isNew ? "POST" : "PUT";
      const res = await fetch("/api/admin/posts", {
        method,
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify(post),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Post saved");
        setEditingPost(null);
        await loadBlogPosts(); // Reload to get fresh IDs from Firestore
      } else {
        setMessage(data.error || "Failed to save post");
      }
    };

    const deletePost = async (id: string) => {
      const res = await fetch(`/api/admin/posts?id=${id}&permanent=true`, {
        method: "DELETE",
        headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
      });
      if (res.ok) {
        setMessage("Post deleted");
        loadBlogPosts();
      }
    };

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Blog Posts</h2>
          <button
            className={orangeBtn}
            onClick={() => setEditingPost({
              id: `new-${Date.now()}`,
              title: "",
              slug: "",
              excerpt: "",
              content: "",
              status: "draft",
            })}
          >
            + New Post
          </button>
        </div>

        {editingPost && (
          <div className="rounded-xl border border-mubah-orange bg-mubah-mid/20 p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Title">
                <input
                  value={editingPost.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = editingPost.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    setEditingPost({ ...editingPost, title, slug });
                  }}
                  className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
                />
              </Field>
              <Field label="Slug">
                <input
                  value={editingPost.slug}
                  onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                  className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
                />
              </Field>
            </div>
            <Field label="Excerpt">
              <textarea
                value={editingPost.excerpt}
                onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
              />
            </Field>
            <Field label="Content (HTML)">
              <textarea
                value={editingPost.content}
                onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                rows={8}
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 font-mono text-sm"
              />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Cover Image">
                <div className="flex gap-2 items-center">
                  {editingPost.coverImage && (
                    <img src={editingPost.coverImage} alt="" className="h-10 w-16 rounded object-cover" />
                  )}
                  <input
                    value={editingPost.coverImage || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, coverImage: e.target.value })}
                    placeholder="URL or upload"
                    className="flex-1 rounded-lg border border-mubah-mid bg-mubah-mid/30 px-2 py-1.5 text-sm"
                  />
                  <button
                    className="rounded bg-mubah-mid/50 px-2 py-1.5 text-xs hover:bg-mubah-mid"
                    onClick={() => {
                      triggerAssetUpload((url) => {
                        setEditingPost((prev) => prev ? { ...prev, coverImage: url } : null);
                      });
                    }}
                  >
                    Upload
                  </button>
                </div>
              </Field>
              <div className="grid gap-3 grid-cols-2">
                <Field label="Author">
                  <input
                    value={editingPost.author || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                    className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={editingPost.status}
                    onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as BlogPost["status"] })}
                    className="w-full rounded-lg border border-mubah-mid bg-mubah-deep text-mubah-cream px-3 py-2 appearance-none cursor-pointer"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Media gallery */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Post Media</div>
              <p className="text-[10px] text-mubah-cream/50">Upload images and videos to use in your blog post.</p>
              <div className="flex flex-wrap gap-2">
                {(editingPost.media || []).map((m, idx) => (
                  <div key={`${m.url}-${idx}`} className="relative group">
                    {m.type === "video" ? (
                      <div className="h-16 w-20 rounded bg-mubah-mid/40 flex items-center justify-center"></div>
                    ) : (
                      <img src={m.url} alt="" className="h-16 w-20 rounded object-cover" />
                    )}
                    <button
                      className="absolute -top-1 -right-1 rounded-full bg-red-500 w-5 h-5 text-[10px] text-white opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        const next = (editingPost.media || []).filter((_, i) => i !== idx);
                        setEditingPost({ ...editingPost, media: next });
                      }}
                    ></button>
                    <button
                      className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] py-0.5 text-white opacity-0 group-hover:opacity-100 text-center"
                      onClick={() => navigator.clipboard.writeText(m.url).then(() => setMessage("URL copied!"))}
                    >Copy URL</button>
                  </div>
                ))}
                <button
                  className="h-16 w-20 rounded border border-dashed border-mubah-mid/60 flex flex-col items-center justify-center text-xs text-mubah-cream/60 hover:bg-mubah-mid/30"
                  onClick={() => {
                    triggerAssetUpload((url) => {
                      const type = /\.(mp4|mov|webm|m4v)$/i.test(url) ? "video" as const : "image" as const;
                      setEditingPost((prev) => prev ? { ...prev, media: [...(prev.media || []), { url, type }] } : null);
                    });
                  }}
                >
                  <span className="text-lg">+</span>
                  <span>Upload</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button className={orangeBtn} onClick={() => savePost(editingPost)}>Save</button>
              <button className={ghostBtn} onClick={() => setEditingPost(null)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {blogPosts.map((post, idx) => (
            <div key={`${post.id}-${idx}`} className="flex items-center gap-3 rounded-xl border border-mubah-mid bg-mubah-mid/10 p-3">
              {post.coverImage && <img src={post.coverImage} alt="" className="h-12 w-16 rounded-lg object-cover" />}
              <div className="flex-1">
                <div className="font-semibold">{post.title}</div>
                <div className="text-xs text-mubah-cream/60">/blog/{post.slug}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${post.status === "published" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                }`}>{post.status}</span>
              <button className={ghostBtn} onClick={() => setEditingPost(post)}>Edit</button>
              <button className="btn-delete" onClick={() => deletePost(post.id)}>Delete</button>
            </div>
          ))}
          {blogPosts.length === 0 && <p className="text-mubah-cream/60 py-4 text-center">No blog posts yet.</p>}
        </div>
      </section>
    );
  };

  // Reviews section
  const renderReviews = () => {
    const saveReview = async (review: Review) => {
      const method = review.id.startsWith("new-") ? "POST" : "PUT";
      const res = await fetch("/api/admin/reviews", {
        method,
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify(review),
      });
      if (res.ok) {
        setMessage("Review saved");
        setEditingReview(null);
        loadReviews();
      } else {
        setMessage("Failed to save review");
      }
    };

    const deleteReview = async (id: string) => {
      const res = await fetch(`/api/admin/reviews?id=${id}&permanent=true`, {
        method: "DELETE",
        headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
      });
      if (res.ok) {
        setMessage("Review deleted");
        loadReviews();
      }
    };

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Customer Reviews</h2>
          <button
            className={orangeBtn}
            onClick={() => setEditingReview({
              id: `new-${Date.now()}`,
              author: "",
              rating: 5,
              text: "",
              status: "pending",
            })}
          >
            + Add Review
          </button>
        </div>

        {editingReview && (
          <div className="rounded-xl border border-mubah-orange bg-mubah-mid/20 p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Author Name">
                <input
                  value={editingReview.author}
                  onChange={(e) => setEditingReview({ ...editingReview, author: e.target.value })}
                  className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
                />
              </Field>
              <Field label="Rating">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEditingReview({ ...editingReview, rating: n })}
                      className={`text-2xl ${n <= editingReview.rating ? "text-mubah-orange" : "text-mubah-mid"}`}
                    ></button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Review Text">
              <textarea
                value={editingReview.text}
                onChange={(e) => setEditingReview({ ...editingReview, text: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
              />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Product (optional)">
                <select
                  value={editingReview.product || ""}
                  onChange={(e) => setEditingReview({ ...editingReview, product: e.target.value || undefined })}
                  className="w-full rounded-lg border border-mubah-mid bg-mubah-deep text-mubah-cream px-3 py-2 appearance-none cursor-pointer"
                >
                  <option value="">No product (general review)</option>
                  {editingReview.product && !products.some((p) => p.id === editingReview.product) && (
                    <option value={editingReview.product}>Legacy: {editingReview.product}</option>
                  )}
                  {[...products]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={editingReview.status}
                  onChange={(e) => setEditingReview({ ...editingReview, status: e.target.value as Review["status"] })}
                  className="w-full rounded-lg border border-mubah-mid bg-mubah-deep text-mubah-cream px-3 py-2 appearance-none cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="hidden">Hidden</option>
                </select>
              </Field>
            </div>

            {/* Media gallery */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Photos & Videos</div>
              <div className="flex flex-wrap gap-2">
                {(editingReview.media || []).map((m, idx) => (
                  <div key={`${m.url}-${idx}`} className="relative group">
                    {m.type === "video" ? (
                      <div className="h-16 w-20 rounded bg-mubah-mid/40 flex items-center justify-center"></div>
                    ) : (
                      <img src={m.url} alt="" className="h-16 w-20 rounded object-cover" />
                    )}
                    <button
                      className="absolute -top-1 -right-1 rounded-full bg-red-500 w-5 h-5 text-[10px] text-white opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        const next = (editingReview.media || []).filter((_, i) => i !== idx);
                        setEditingReview({ ...editingReview, media: next });
                      }}
                    ></button>
                  </div>
                ))}
                <button
                  className="h-16 w-20 rounded border border-dashed border-mubah-mid/60 flex flex-col items-center justify-center text-xs text-mubah-cream/60 hover:bg-mubah-mid/30"
                  onClick={() => {
                    triggerAssetUpload((url) => {
                      const type = /\.(mp4|mov|webm|m4v)$/i.test(url) ? "video" as const : "image" as const;
                      setEditingReview((prev) => prev ? { ...prev, media: [...(prev.media || []), { url, type }] } : null);
                    });
                  }}
                >
                  <span className="text-lg">+</span>
                  <span>Upload</span>
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editingReview.verified || false}
                onChange={(e) => setEditingReview({ ...editingReview, verified: e.target.checked })}
              />
              Verified Purchase
            </label>
            <div className="flex gap-2">
              <button className={orangeBtn} onClick={() => saveReview(editingReview)}>Save</button>
              <button className={ghostBtn} onClick={() => setEditingReview(null)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {reviews.map((review, idx) => (
            <div key={`${review.id}-${idx}`} className="flex items-center gap-3 rounded-xl border border-mubah-mid bg-mubah-mid/10 p-3">
              {review.media?.[0] && (
                review.media[0].type === "video" ? (
                  <div className="h-10 w-10 rounded-full bg-mubah-mid/40 flex items-center justify-center"></div>
                ) : (
                  <img src={review.media[0].url} alt="" className="h-10 w-10 rounded-full object-cover" />
                )
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{review.author}</span>
                  <span className="text-mubah-orange">{"".repeat(review.rating)}</span>
                  {review.verified && <span className="text-[10px] text-green-400"> Verified</span>}
                </div>
                {review.product && (
                  <div className="text-[11px] text-mubah-orange/90">
                    Product: {products.find((p) => p.id === review.product)?.name || review.product}
                  </div>
                )}
                <div className="text-xs text-mubah-cream/70 line-clamp-1">{review.text}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${review.status === "approved" ? "bg-green-500/20 text-green-400" :
                review.status === "hidden" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                }`}>{review.status}</span>
              <button className={ghostBtn} onClick={() => setEditingReview(review)}>Edit</button>
              <button className="btn-delete" onClick={() => deleteReview(review.id)}>Delete</button>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-mubah-cream/60 py-4 text-center">No reviews yet.</p>}
        </div>
      </section>
    );
  };

  // Partners section (standalone page)
  const renderPartners = () => {
    const savePartners = async () => {
      const payload = { ...siteAssets, partners };
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify(payload),
      });
      setMessage(res.ok ? "Partners saved" : "Failed to save");
    };

    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl">Partners & Collaborators</h2>
            <p className="text-sm text-mubah-cream/60">Brands and partners shown in the homepage carousel.</p>
          </div>
          <button className={orangeBtn} onClick={savePartners}>Save Partners</button>
        </div>

        {/* Add new partner */}
        <div className="rounded-xl border border-mubah-orange bg-mubah-mid/20 p-4 space-y-3">
          <div className="text-xs uppercase tracking-[0.14em] text-mubah-orange">Add New Partner</div>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Partner Name">
              <input
                value={newPartner.name}
                onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                placeholder="Brand Name"
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
              />
            </Field>
            <Field label="Website (optional)">
              <input
                value={newPartner.website || ""}
                onChange={(e) => setNewPartner({ ...newPartner, website: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
              />
            </Field>
            <Field label="Logo Size">
              <select
                value={newPartner.size || "medium"}
                onChange={(e) => setNewPartner({ ...newPartner, size: e.target.value as any })}
                className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
              >
                <option value="small">Small (48px)</option>
                <option value="medium">Medium (64px) - Default</option>
                <option value="large">Large (80px)</option>
                <option value="xlarge">Extra Large (96px)</option>
              </select>
            </Field>
          </div>
          <Field label="Logo">
            <div className="flex gap-3 items-center">
              <button
                onClick={() => {
                  triggerAssetUpload((url) => {
                    setNewPartner((prev) => ({ ...prev, logo: url }));
                  });
                }}
                className="relative h-16 w-24 rounded-lg border-2 border-dashed border-mubah-mid hover:border-mubah-orange transition flex items-center justify-center bg-mubah-mid/20 overflow-hidden group"
              >
                {newPartner.logo ? (
                  <>
                    <img src={newPartner.logo} alt="" className="h-full w-full object-contain p-1" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-mubah-cream transition">Change</div>
                  </>
                ) : (
                  <span className="text-2xl text-mubah-cream/50 group-hover:text-mubah-orange">+</span>
                )}
              </button>
              <span className="text-xs text-mubah-cream/60">Click to upload logo image</span>
            </div>
          </Field>
          <button
            className={orangeBtn}
            onClick={() => {
              if (!newPartner.name.trim()) return;
              setPartners([...partners, { ...newPartner }]);
              setNewPartner({ name: "", logo: "", website: "", size: "medium" });
            }}
          >
            Add Partner
          </button>
        </div>

        {/* Partners list */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner, idx) => (
            <div key={`${partner.name}-${idx}`} className="rounded-xl border border-mubah-mid bg-mubah-mid/10 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {partner.logo ? (
                    <img src={partner.logo} alt={partner.name} className="h-12 w-auto max-w-[80px] object-contain" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-mubah-mid/40 flex items-center justify-center text-xl"></div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{partner.name}</div>
                    {partner.website && <div className="text-[10px] text-mubah-cream/50 truncate">{partner.website}</div>}
                    <div className="text-[10px] text-mubah-orange mt-1">
                      Size: {partner.size || 'medium'}
                    </div>
                  </div>
                </div>
                <button
                  className="text-red-400 text-xs hover:text-red-300 flex-shrink-0"
                  onClick={() => setPartners(partners.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              </div>
              <select
                value={partner.size || "medium"}
                onChange={(e) => {
                  const updated = [...partners];
                  updated[idx] = { ...partner, size: e.target.value as any };
                  setPartners(updated);
                }}
                className="w-full rounded border border-mubah-mid bg-mubah-mid/30 px-2 py-1 text-xs"
              >
                <option value="small">Small (48px)</option>
                <option value="medium">Medium (64px)</option>
                <option value="large">Large (80px)</option>
                <option value="xlarge">Extra Large (96px)</option>
              </select>
              <div className="flex gap-1">
                {idx > 0 && (
                  <button
                    className="rounded bg-mubah-mid/50 px-2 py-1 text-[10px] hover:bg-mubah-mid"
                    onClick={() => {
                      const next = [...partners];
                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                      setPartners(next);
                    }}
                  > Move up</button>
                )}
                {idx < partners.length - 1 && (
                  <button
                    className="rounded bg-mubah-mid/50 px-2 py-1 text-[10px] hover:bg-mubah-mid"
                    onClick={() => {
                      const next = [...partners];
                      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                      setPartners(next);
                    }}
                  >Move down </button>
                )}
              </div>
            </div>
          ))}
          {partners.length === 0 && (
            <div className="col-span-full text-center py-8 text-mubah-cream/50">
              No partners added yet. Add your first partner above!
            </div>
          )}
        </div>
      </section>
    );
  };

  // Signature Cuts Management
  const renderSignatureCutsManagement = () => {
    const signatureCuts = siteAssets.signatureCuts || [];

    const saveCuts = async () => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify(siteAssets),
      });
      setMessage(res.ok ? "Signature cuts saved" : "Failed to save");
    };

    const addCut = () => {
      if (!newSignatureCut.title?.trim() || !newSignatureCut.slug?.trim() || !newSignatureCut.image?.trim()) {
        setMessage("Please fill in title, slug, and image");
        return;
      }
      const cut: SignatureCut = {
        id: newSignatureCut.slug || Date.now().toString(),
        title: newSignatureCut.title || "",
        copy: newSignatureCut.copy || "",
        image: newSignatureCut.image || "",
        slug: newSignatureCut.slug || "",
        order: newSignatureCut.order || signatureCuts.length,
      };
      setSiteAssets({
        ...siteAssets,
        signatureCuts: [...signatureCuts, cut],
      });
      setNewSignatureCut({ title: "", copy: "", image: "", slug: "", order: signatureCuts.length + 1 });
      setMessage("Signature cut added! Click Save Signature Cuts to persist.");
    };

    const removeCut = (index: number) => {
      setSiteAssets({
        ...siteAssets,
        signatureCuts: signatureCuts.filter((_, i) => i !== index),
      });
    };

    const moveCut = (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= signatureCuts.length) return;
      const updated = [...signatureCuts];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      updated.forEach((cut, i) => cut.order = i);
      setSiteAssets({ ...siteAssets, signatureCuts: updated });
    };

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl"></div>
            <div>
              <h3 className="text-xl font-semibold">Signature Cuts Management</h3>
              <div className="text-xs text-mubah-cream/60">Add, edit, remove, or reorder signature cuts on homepage</div>
            </div>
          </div>
          <button className={orangeBtn} onClick={saveCuts}>Save Signature Cuts</button>
        </div>

        {/* Add new cut form */}
        <div className="rounded-xl border border-mubah-mid bg-mubah-mid/10 p-4 space-y-3">
          <div className="text-sm font-semibold text-mubah-orange">Add New Signature Cut</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Title *">
              <input
                type="text"
                value={newSignatureCut.title || ""}
                onChange={(e) => setNewSignatureCut({ ...newSignatureCut, title: e.target.value })}
                placeholder="e.g., Resort Wear"
                className={inputCls}
              />
            </Field>
            <Field label="Slug * (no spaces, used in URL)">
              <input
                type="text"
                value={newSignatureCut.slug || ""}
                onChange={(e) => setNewSignatureCut({ ...newSignatureCut, slug: e.target.value.replace(/\s+/g, "") })}
                placeholder="e.g., resortWear"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={newSignatureCut.copy || ""}
              onChange={(e) => setNewSignatureCut({ ...newSignatureCut, copy: e.target.value })}
              placeholder="e.g., Light and breezy for tropical evenings"
              rows={2}
              className={inputCls}
            />
          </Field>
          <Field label="Image URL *">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSignatureCut.image || ""}
                onChange={(e) => setNewSignatureCut({ ...newSignatureCut, image: e.target.value })}
                placeholder="Paste image URL or click upload"
                className={inputCls}
              />
              <button
                className="rounded bg-mubah-mid/50 px-3 py-2 text-xs hover:bg-mubah-mid whitespace-nowrap"
                onClick={() => {
                  triggerAssetUpload((url) => setNewSignatureCut({ ...newSignatureCut, image: url }));
                }}
              >
                Upload
              </button>
            </div>
          </Field>
          {newSignatureCut.image && (
            <div className="relative h-32 rounded-lg overflow-hidden border border-mubah-mid">
              <img src={newSignatureCut.image} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
          <button className={orangeBtn} onClick={addCut}>
            Add Signature Cut
          </button>
        </div>

        {/* Existing cuts list */}
        <div className="grid gap-4 md:grid-cols-2">
          {signatureCuts.map((cut, idx) => (
            <div key={cut.id} className="rounded-xl border border-mubah-mid bg-mubah-mid/10 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{cut.title}</div>
                  <div className="text-xs text-mubah-cream/60 mt-1">{cut.copy}</div>
                  <div className="text-[10px] text-mubah-orange mt-1">Slug: {cut.slug}</div>
                </div>
                <button
                  className="text-red-400 text-xs hover:text-red-300 flex-shrink-0"
                  onClick={() => {
                    if (confirm(`Remove "${cut.title}"?`)) removeCut(idx);
                  }}
                >
                  Remove
                </button>
              </div>
              {cut.image && (
                <div className="relative h-24 rounded overflow-hidden">
                  <img src={cut.image} alt={cut.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex gap-1">
                {idx > 0 && (
                  <button
                    className="rounded bg-mubah-mid/50 px-2 py-1 text-[10px] hover:bg-mubah-mid"
                    onClick={() => moveCut(idx, "up")}
                  >
                     Move up
                  </button>
                )}
                {idx < signatureCuts.length - 1 && (
                  <button
                    className="rounded bg-mubah-mid/50 px-2 py-1 text-[10px] hover:bg-mubah-mid"
                    onClick={() => moveCut(idx, "down")}
                  >
                    Move down 
                  </button>
                )}
              </div>
            </div>
          ))}
          {signatureCuts.length === 0 && (
            <div className="col-span-full text-center py-8 text-mubah-cream/50">
              No custom signature cuts. Add your first cut above, or defaults will show on homepage.
            </div>
          )}
        </div>
      </section>
    );
  };

  // Instagram Feed Management
  const renderInstagramManagement = () => {
    const photos = siteAssets.instagramPhotos || [];

    const savePhotos = async () => {
      const normalizedPhotos = photos.map((photo, index) => ({
        ...photo,
        link: INSTAGRAM_PROFILE_URL,
        order: typeof photo.order === "number" ? photo.order : index,
      }));
      const payload = {
        ...siteAssets,
        instagramPhotos: normalizedPhotos,
      };
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify(payload),
      });
      if (res.ok) setSiteAssets(payload);
      setMessage(res.ok ? "Instagram photos saved" : "Failed to save");
    };

    const addPhoto = () => {
      if (!newInstagramPhoto.imageUrl?.trim()) {
        setMessage("Please add an image URL");
        return;
      }
      const photo: InstagramPhoto = {
        id: Date.now().toString(),
        imageUrl: newInstagramPhoto.imageUrl,
        caption: newInstagramPhoto.caption || "",
        link: INSTAGRAM_PROFILE_URL,
        order: newInstagramPhoto.order || photos.length,
      };
      setSiteAssets({
        ...siteAssets,
        instagramPhotos: [...photos, photo],
      });
      setNewInstagramPhoto({ imageUrl: "", caption: "", link: INSTAGRAM_PROFILE_URL, order: photos.length + 1 });
      setMessage("Photo added! Click Save Instagram Photos to persist.");
    };

    const removePhoto = (index: number) => {
      setSiteAssets({
        ...siteAssets,
        instagramPhotos: photos.filter((_, i) => i !== index),
      });
    };

    const movePhoto = (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= photos.length) return;
      const updated = [...photos];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      updated.forEach((photo, i) => photo.order = i);
      setSiteAssets({ ...siteAssets, instagramPhotos: updated });
    };

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl"></div>
            <div>
              <h3 className="text-xl font-semibold">Instagram Feed Management</h3>
              <div className="text-xs text-mubah-cream/60">Manage photos shown in "Follow @meraki_the_brand" section</div>
            </div>
          </div>
          <button className={orangeBtn} onClick={savePhotos}>Save Instagram Photos</button>
        </div>

        <div className="rounded-xl border border-mubah-mid bg-mubah-mid/10 p-4 space-y-3">
          <div className="text-sm font-semibold text-mubah-orange">Add New Photo</div>
          <Field label="Image URL *">
            <div className="flex gap-2">
              <input
                type="text"
                value={newInstagramPhoto.imageUrl || ""}
                onChange={(e) => setNewInstagramPhoto({ ...newInstagramPhoto, imageUrl: e.target.value })}
                placeholder="Paste image URL or click upload"
                className={inputCls}
              />
              <button
                className="rounded bg-mubah-mid/50 px-3 py-2 text-xs hover:bg-mubah-mid whitespace-nowrap"
                onClick={() => {
                  triggerAssetUpload((url) => setNewInstagramPhoto({ ...newInstagramPhoto, imageUrl: url }));
                }}
              >
                Upload
              </button>
            </div>
          </Field>
          <Field label="Caption (optional)">
            <input
              type="text"
              value={newInstagramPhoto.caption || ""}
              onChange={(e) => setNewInstagramPhoto({ ...newInstagramPhoto, caption: e.target.value })}
              placeholder="Photo caption"
              className={inputCls}
            />
          </Field>
          <p className="text-xs text-mubah-cream/70">
            Every Instagram feed photo links to{" "}
            <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer" className="underline">
              meraki_the_brand
            </a>
            .
          </p>
          {newInstagramPhoto.imageUrl && (
            <div className="relative h-32 rounded-lg overflow-hidden border border-mubah-mid">
              <img src={newInstagramPhoto.imageUrl} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
          <button className={orangeBtn} onClick={addPhoto}>
            Add Photo
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="rounded-xl border border-mubah-mid bg-mubah-mid/10 p-3 space-y-2">
              <div className="relative h-32 rounded overflow-hidden">
                <img src={photo.imageUrl} alt={photo.caption || "Instagram"} className="h-full w-full object-cover" />
              </div>
              {photo.caption && <div className="text-xs text-mubah-cream/60 line-clamp-2">{photo.caption}</div>}
              <div className="flex gap-1">
                {idx > 0 && (
                  <button
                    className="rounded bg-mubah-mid/50 px-2 py-1 text-[10px] hover:bg-mubah-mid"
                    onClick={() => movePhoto(idx, "up")}
                  ></button>
                )}
                {idx < photos.length - 1 && (
                  <button
                    className="rounded bg-mubah-mid/50 px-2 py-1 text-[10px] hover:bg-mubah-mid"
                    onClick={() => movePhoto(idx, "down")}
                  ></button>
                )}
                <button
                  className="ml-auto text-red-400 text-[10px] hover:text-red-300"
                  onClick={() => {
                    if (confirm("Remove this photo?")) removePhoto(idx);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {photos.length === 0 && (
            <div className="col-span-full text-center py-8 text-mubah-cream/50">
              No photos added. Add your first photo above!
            </div>
          )}
        </div>
      </section>
    );
  };

  // Editorial Customers Management
  const renderEditorialManagement = () => {
    const photos = siteAssets.editorialPhotos || [];

    const savePhotos = async () => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify(siteAssets),
      });
      setMessage(res.ok ? "Editorial photos saved" : "Failed to save");
    };

    const addPhoto = () => {
      if (!newEditorialPhoto.imageUrl?.trim()) {
        setMessage("Please add an image URL");
        return;
      }
      const photo: EditorialPhoto = {
        id: Date.now().toString(),
        imageUrl: newEditorialPhoto.imageUrl,
        caption: newEditorialPhoto.caption || "",
        span: newEditorialPhoto.span || "col-span-4",
        height: newEditorialPhoto.height || 360,
        offset: newEditorialPhoto.offset || "",
        order: newEditorialPhoto.order || photos.length,
      };
      setSiteAssets({
        ...siteAssets,
        editorialPhotos: [...photos, photo],
      });
      setNewEditorialPhoto({ imageUrl: "", caption: "", span: "col-span-4", height: 360, offset: "", order: photos.length + 1 });
      setMessage("Photo added! Click Save Editorial Photos to persist.");
    };

    const removePhoto = (index: number) => {
      setSiteAssets({
        ...siteAssets,
        editorialPhotos: photos.filter((_, i) => i !== index),
      });
    };

    const movePhoto = (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= photos.length) return;
      const updated = [...photos];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      updated.forEach((photo, i) => photo.order = i);
      setSiteAssets({ ...siteAssets, editorialPhotos: updated });
    };

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl"></div>
            <div>
              <h3 className="text-xl font-semibold">Real People in MERAKI</h3>
              <div className="text-xs text-mubah-cream/60">Editorial customer photos in collage layout</div>
            </div>
          </div>
          <button className={orangeBtn} onClick={savePhotos}>Save Editorial Photos</button>
        </div>

        <div className="rounded-xl border border-mubah-mid bg-mubah-mid/10 p-4 space-y-3">
          <div className="text-sm font-semibold text-mubah-orange">Add New Photo</div>
          <Field label="Image URL *">
            <div className="flex gap-2">
              <input
                type="text"
                value={newEditorialPhoto.imageUrl || ""}
                onChange={(e) => setNewEditorialPhoto({ ...newEditorialPhoto, imageUrl: e.target.value })}
                placeholder="Paste image URL or click upload"
                className={inputCls}
              />
              <button
                className="rounded bg-mubah-mid/50 px-3 py-2 text-xs hover:bg-mubah-mid whitespace-nowrap"
                onClick={() => {
                  triggerAssetUpload((url) => setNewEditorialPhoto({ ...newEditorialPhoto, imageUrl: url }));
                }}
              >
                Upload
              </button>
            </div>
          </Field>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Grid Span">
              <select
                value={newEditorialPhoto.span || "col-span-4"}
                onChange={(e) => setNewEditorialPhoto({ ...newEditorialPhoto, span: e.target.value })}
                className={inputCls}
              >
                <option value="col-span-3">Small (3 cols)</option>
                <option value="col-span-4">Medium (4 cols)</option>
                <option value="col-span-5">Large (5 cols)</option>
                <option value="col-span-6">Extra Large (6 cols)</option>
              </select>
            </Field>
            <Field label="Height (px)">
              <input
                type="number"
                value={newEditorialPhoto.height || 360}
                onChange={(e) => setNewEditorialPhoto({ ...newEditorialPhoto, height: parseInt(e.target.value) || 360 })}
                className={inputCls}
              />
            </Field>
            <Field label="Offset">
              <select
                value={newEditorialPhoto.offset || ""}
                onChange={(e) => setNewEditorialPhoto({ ...newEditorialPhoto, offset: e.target.value })}
                className={inputCls}
              >
                <option value="">None</option>
                <option value="-translate-y-2">Up Small</option>
                <option value="-translate-y-4">Up Medium</option>
                <option value="translate-y-6">Down Small</option>
                <option value="translate-y-8">Down Medium</option>
                <option value="translate-y-10">Down Large</option>
              </select>
            </Field>
          </div>
          {newEditorialPhoto.imageUrl && (
            <div className="relative h-32 rounded-lg overflow-hidden border border-mubah-mid">
              <img src={newEditorialPhoto.imageUrl} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
          <button className={orangeBtn} onClick={addPhoto}>
            Add Photo
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="rounded-xl border border-mubah-mid bg-mubah-mid/10 p-3 space-y-2">
              <div className="relative h-32 rounded overflow-hidden">
                <img src={photo.imageUrl} alt={photo.caption || "Editorial"} className="h-full w-full object-cover" />
              </div>
              <div className="text-[10px] space-y-1 text-mubah-cream/60">
                <div>Span: {photo.span}</div>
                <div>Height: {photo.height}px</div>
                {photo.offset && <div>Offset: {photo.offset}</div>}
              </div>
              <div className="flex gap-1">
                {idx > 0 && (
                  <button
                    className="rounded bg-mubah-mid/50 px-2 py-1 text-[10px] hover:bg-mubah-mid"
                    onClick={() => movePhoto(idx, "up")}
                  ></button>
                )}
                {idx < photos.length - 1 && (
                  <button
                    className="rounded bg-mubah-mid/50 px-2 py-1 text-[10px] hover:bg-mubah-mid"
                    onClick={() => movePhoto(idx, "down")}
                  ></button>
                )}
                <button
                  className="ml-auto text-red-400 text-[10px] hover:text-red-300"
                  onClick={() => {
                    if (confirm("Remove this photo?")) removePhoto(idx);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {photos.length === 0 && (
            <div className="col-span-full text-center py-8 text-mubah-cream/50">
              No photos added. Add your first photo above!
            </div>
          )}
        </div>
      </section>
    );
  };

  // Users section - Registered users who can write reviews
  const renderUsers = () => {
    const deleteUser = async (uid: string) => {
      if (!confirm("Delete this user? This cannot be undone.")) return;
      const res = await fetch(`/api/admin/users?uid=${uid}`, {
        method: "DELETE",
        headers: { ...(storedToken ? { "x-admin-token": storedToken } : {}) },
      });
      if (res.ok) {
        setMessage("User deleted");
        loadUsers();
      } else {
        setMessage("Failed to delete user");
      }
    };

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl">Registered Users</h2>
            <p className="text-sm text-mubah-cream/60">
              Users who have signed up to write reviews. {users.length} total.
            </p>
          </div>
          <button className={ghostBtn} onClick={loadUsers} disabled={usersLoading}>
            {usersLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="rounded-xl border border-mubah-mid bg-mubah-mid/20 p-4">
          {usersLoading ? (
            <p className="text-center text-mubah-cream/60">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-mubah-cream/60">No registered users yet.</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center justify-between rounded-lg border border-mubah-mid/40 bg-mubah-mid/15 p-4"
                >
                  <div className="flex items-center gap-3">
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="h-10 w-10 rounded-full border border-mubah-mid object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium text-mubah-cream">{user.displayName || "Unknown"}</div>
                      <div className="text-xs text-mubah-cream/60">{user.email}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-mubah-cream/50">
                        <span className="rounded-full bg-mubah-mid/50 px-2 py-0.5">
                          {user.provider === "google" ? "Google" : "Email"}
                        </span>
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteUser(user.uid)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderGiftCards = () => {
    const createCard = async () => {
      const isDiscountCode = giftCardForm.kind === "discount_code";
      const amount = Number(giftCardForm.amount || 0);
      const discountByCurrency = Object.entries(giftCardForm.discountByCurrency || {}).reduce<Record<string, number>>(
        (acc, [currency, rawValue]) => {
          const parsed = Number(rawValue);
          if (Number.isFinite(parsed) && parsed > 0) {
            acc[currency.toUpperCase()] = parsed;
          }
          return acc;
        },
        {},
      );
      if (isDiscountCode) {
        if (Object.keys(discountByCurrency).length === 0) {
          setMessage("Add at least one currency discount value.");
          return;
        }
      } else if (!Number.isFinite(amount) || amount <= 0) {
        setMessage("Gift card amount must be greater than 0");
        return;
      }

      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify({
          kind: giftCardForm.kind,
          code: giftCardForm.code.trim() || undefined,
          amount: isDiscountCode ? undefined : amount,
          discountType: isDiscountCode ? giftCardForm.discountType : undefined,
          discountByCurrency: isDiscountCode ? discountByCurrency : undefined,
          expiryDate: giftCardForm.expiryDate || undefined,
          recipientName: isDiscountCode ? undefined : giftCardForm.recipientName.trim() || undefined,
          recipientEmail: isDiscountCode ? undefined : giftCardForm.recipientEmail.trim() || undefined,
          senderName: isDiscountCode ? undefined : giftCardForm.senderName.trim() || undefined,
          note: giftCardForm.note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(err.error || "Failed to create gift card");
        return;
      }
      setGiftCardForm({
        kind: "discount_code",
        code: "",
        amount: "100",
        discountType: "amount",
        discountByCurrency: {
          TZS: "",
          USD: "",
        },
        expiryDate: "",
        recipientName: "",
        recipientEmail: "",
        senderName: "",
        note: "",
      });
      setMessage(isDiscountCode ? "Discount code created" : "Gift card created");
      loadGiftCards();
    };

    const updateCardStatus = async (code: string, status: GiftCardRecord["status"]) => {
      const res = await fetch("/api/admin/gift-cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify({ code, status }),
      });
      if (res.ok) {
        setMessage("Gift card updated");
        loadGiftCards();
      } else {
        setMessage("Failed to update gift card");
      }
    };

    const createCardFromRequest = async (request: GiftCardRequestRecord) => {
      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify({
          amount: request.amount,
          recipientName: request.recipientName,
          recipientEmail: request.recipientEmail,
          senderName: request.senderName,
          note: request.message || undefined,
          requestId: request.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(err.error || "Failed to issue gift card from request");
        return;
      }
      setMessage(`Gift card issued for request ${request.id}`);
      loadGiftCards();
    };

    const updateGiftRequestStatus = async (
      requestId: string,
      requestStatus: GiftCardRequestRecord["status"],
    ) => {
      const res = await fetch("/api/admin/gift-cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify({ requestId, requestStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(err.error || "Failed to update gift request");
        return;
      }
      setMessage("Gift request updated");
      loadGiftCards();
    };

    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4 space-y-3">
          <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Create code</div>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-xs text-mubah-cream/70">
              Code type
              <select
                value={giftCardForm.kind}
                onChange={(e) =>
                  setGiftCardForm((prev) => ({
                    ...prev,
                    kind: e.target.value === "gift_card" ? "gift_card" : "discount_code",
                  }))
                }
                className={inputCls}
              >
                <option value="discount_code">Discount code</option>
                <option value="gift_card">Gift card</option>
              </select>
            </label>
            <label className="text-xs text-mubah-cream/70">
              Custom code (optional)
              <input
                value={giftCardForm.code}
                onChange={(e) => setGiftCardForm((prev) => ({ ...prev, code: e.target.value }))}
                className={inputCls}
                placeholder="MERAKI-AB12-CD34"
              />
            </label>
            {giftCardForm.kind === "gift_card" ? (
              <label className="text-xs text-mubah-cream/70">
                Amount
                <input
                  type="number"
                  min={1}
                  value={giftCardForm.amount}
                  onChange={(e) => setGiftCardForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className={inputCls}
                />
              </label>
            ) : (
              <label className="text-xs text-mubah-cream/70">
                Discount type
                <select
                  value={giftCardForm.discountType}
                  onChange={(e) =>
                    setGiftCardForm((prev) => ({
                      ...prev,
                      discountType: e.target.value === "percent" ? "percent" : "amount",
                    }))
                  }
                  className={inputCls}
                >
                  <option value="amount">Fixed amount</option>
                  <option value="percent">Percent</option>
                </select>
              </label>
            )}
            <label className="text-xs text-mubah-cream/70">
              Expiry (optional)
              <input
                type="date"
                value={giftCardForm.expiryDate}
                onChange={(e) => setGiftCardForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                className={inputCls}
              />
            </label>
            {giftCardForm.kind === "discount_code" ? (
              <>
                {CODE_CURRENCIES.map((currency) => (
                  <label key={currency} className="text-xs text-mubah-cream/70">
                    {currency} {giftCardForm.discountType === "percent" ? "%" : "discount"}
                    <input
                      type="number"
                      min={0}
                      value={giftCardForm.discountByCurrency[currency]}
                      onChange={(e) =>
                        setGiftCardForm((prev) => ({
                          ...prev,
                          discountByCurrency: {
                            ...prev.discountByCurrency,
                            [currency]: e.target.value,
                          },
                        }))
                      }
                      className={inputCls}
                      placeholder={giftCardForm.discountType === "percent" ? "10" : "1000"}
                    />
                  </label>
                ))}
              </>
            ) : (
              <>
                <label className="text-xs text-mubah-cream/70">
                  Recipient email
                  <input
                    type="email"
                    value={giftCardForm.recipientEmail}
                    onChange={(e) => setGiftCardForm((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                    className={inputCls}
                    placeholder="recipient@example.com"
                  />
                </label>
                <label className="text-xs text-mubah-cream/70">
                  Recipient name
                  <input
                    value={giftCardForm.recipientName}
                    onChange={(e) => setGiftCardForm((prev) => ({ ...prev, recipientName: e.target.value }))}
                    className={inputCls}
                    placeholder="Recipient name"
                  />
                </label>
                <label className="text-xs text-mubah-cream/70">
                  Sender name
                  <input
                    value={giftCardForm.senderName}
                    onChange={(e) => setGiftCardForm((prev) => ({ ...prev, senderName: e.target.value }))}
                    className={inputCls}
                    placeholder="Sender"
                  />
                </label>
              </>
            )}
            <label className="text-xs text-mubah-cream/70 md:col-span-2">
              Admin note
              <input
                value={giftCardForm.note}
                onChange={(e) => setGiftCardForm((prev) => ({ ...prev, note: e.target.value }))}
                className={inputCls}
                placeholder="Internal note"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button className={orangeBtn} onClick={createCard}>
              Create code
            </button>
            <button className={ghostBtn} onClick={loadGiftCards} disabled={giftCardsLoading}>
              {giftCardsLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4">
          <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Gift requests</div>
          {giftCardsLoading ? (
            <p className="mt-3 text-sm text-mubah-cream/70">Loading gift requests...</p>
          ) : giftCardRequests.length === 0 ? (
            <p className="mt-3 text-sm text-mubah-cream/70">No gift requests yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {giftCardRequests.map((request) => (
                <div key={request.id} className="rounded-xl border border-mubah-mid bg-mubah-mid/25 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-mubah-cream">
                        {request.recipientName} ({request.recipientEmail})
                      </div>
                      <div className="text-xs text-mubah-cream/70">
                        {request.currency} {request.amount} from {request.senderName} ({request.senderEmail})
                      </div>
                      <div className="text-xs text-mubah-cream/60">
                        Requested {new Date(request.createdAt).toLocaleString()}
                        {request.deliveryDate ? `  Deliver ${new Date(request.deliveryDate).toLocaleDateString()}` : ""}
                        {request.issuedGiftCardCode ? `  Issued: ${request.issuedGiftCardCode}` : ""}
                      </div>
                      {request.message && <div className="mt-1 text-xs text-mubah-cream/70">"{request.message}"</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.08em] ${
                          request.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : request.status === "approved"
                              ? "bg-green-500/20 text-green-300"
                              : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {request.status}
                      </span>
                      {request.status === "pending" && (
                        <>
                          <button
                            className="rounded border border-green-500/50 px-2 py-1 text-xs text-green-300 hover:bg-green-500/10"
                            onClick={() => createCardFromRequest(request)}
                          >
                            Issue code
                          </button>
                          <button
                            className="rounded border border-red-500/50 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                            onClick={() => updateGiftRequestStatus(request.id, "cancelled")}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-4">
          <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Issued codes</div>
          {giftCardsLoading ? (
            <p className="mt-3 text-sm text-mubah-cream/70">Loading gift cards...</p>
          ) : giftCards.length === 0 ? (
            <p className="mt-3 text-sm text-mubah-cream/70">No codes issued yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {giftCards.map((card) => (
                <div key={card.code} className="rounded-xl border border-mubah-mid bg-mubah-mid/25 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-mubah-cream">{card.code}</div>
                      {card.kind === "discount_code" ? (
                        <div className="text-xs text-mubah-cream/70">
                          {card.discountType === "percent" ? "Percent" : "Fixed"} discount
                          {card.expiryDate ? `  Expires ${new Date(card.expiryDate).toLocaleDateString()}` : "  No expiry"}
                          {card.discountByCurrency &&
                            Object.entries(card.discountByCurrency)
                              .filter(([, value]) => Number(value) > 0)
                              .map(([currency, value]) => `${currency}: ${value}`)
                              .join("  |  ")}
                        </div>
                      ) : (
                        <>
                          <div className="text-xs text-mubah-cream/70">
                            Balance {card.balance} / {card.originalAmount}
                            {card.expiryDate ? `  Expires ${new Date(card.expiryDate).toLocaleDateString()}` : "  No expiry"}
                          </div>
                          {(card.recipientEmail || card.recipientName) && (
                            <div className="text-xs text-mubah-cream/60">
                              Recipient: {card.recipientName || "-"} {card.recipientEmail ? `(${card.recipientEmail})` : ""}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.08em] ${
                          card.status === "active"
                            ? "bg-green-500/20 text-green-300"
                            : card.status === "redeemed"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {card.status}
                      </span>
                      {card.status !== "disabled" && (
                        <button
                          className="rounded border border-red-500/50 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                          onClick={() => updateCardStatus(card.code, "disabled")}
                        >
                          Disable
                        </button>
                      )}
                      {card.status === "disabled" && (
                        <button
                          className="rounded border border-green-500/50 px-2 py-1 text-xs text-green-300 hover:bg-green-500/10"
                          onClick={() => updateCardStatus(card.code, "active")}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderStorefrontControls = () => {
    const contactSettings = siteAssets.contact || {};
    const saleSettings = siteAssets.globalSale || {};
    const sectionVisibility = siteAssets.sectionVisibility || {};
    const sectionOptions: Array<{ key: string; label: string }> = [
      { key: "hero", label: "Hero" },
      { key: "quickShop", label: "Quick Shop" },
      { key: "signatureCuts", label: "Signature Cuts" },
      { key: "aboutMubah", label: "About Section" },
      { key: "editorialCustomers", label: "Real People" },
      { key: "materialTexture", label: "Material Texture" },
      { key: "partners", label: "Partners" },
      { key: "instagramFeed", label: "Instagram Feed" },
    ];

    const saveStorefrontControls = async () => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify(siteAssets),
      });
      if (!res.ok) {
        setMessage("Failed to save storefront controls");
        return;
      }
      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      if (data.assets && typeof data.assets === "object") {
        setSiteAssets(data.assets as SiteAssets);
      }
      setMessage("Storefront controls saved");
    };

    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg">Storefront Controls</h3>
              <p className="text-sm text-mubah-cream/65">Control WhatsApp, custom-cut form, flash sale and section visibility.</p>
            </div>
            <button className={orangeBtn} onClick={saveStorefrontControls}>Save changes</button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">WhatsApp Number</span>
              <input
                value={contactSettings.whatsappNumber || ""}
                onChange={(e) =>
                  setSiteAssets({
                    ...siteAssets,
                    contact: { ...contactSettings, whatsappNumber: e.target.value },
                  })
                }
                placeholder="2557XXXXXXXX"
                className={inputCls}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Contact Phone</span>
              <input
                value={contactSettings.phone || ""}
                onChange={(e) =>
                  setSiteAssets({
                    ...siteAssets,
                    contact: { ...contactSettings, phone: e.target.value },
                  })
                }
                placeholder="+255 ..."
                className={inputCls}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Contact Email</span>
              <input
                value={contactSettings.email || ""}
                onChange={(e) =>
                  setSiteAssets({
                    ...siteAssets,
                    contact: { ...contactSettings, email: e.target.value },
                  })
                }
                placeholder="hello@merakithebrand.com"
                className={inputCls}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Studio</span>
              <input
                value={contactSettings.studio || ""}
                onChange={(e) =>
                  setSiteAssets({
                    ...siteAssets,
                    contact: { ...contactSettings, studio: e.target.value },
                  })
                }
                placeholder="Dar es Salaam, Tanzania"
                className={inputCls}
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-mubah-cream">
            <input
              type="checkbox"
              checked={contactSettings.enableCustomCutsForm !== false}
              onChange={(e) =>
                setSiteAssets({
                  ...siteAssets,
                  contact: { ...contactSettings, enableCustomCutsForm: e.target.checked },
                })
              }
            />
            Enable custom-cut request form on Contact page
          </label>

          <div className="mt-6 rounded-xl border border-mubah-mid/50 bg-mubah-mid/15 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-mubah-orange">Flash Sale</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Label</span>
                <input
                  value={saleSettings.label || ""}
                  onChange={(e) =>
                    setSiteAssets({
                      ...siteAssets,
                      globalSale: { ...saleSettings, label: e.target.value },
                    })
                  }
                  placeholder="FLASH SALE - UP TO 30% OFF"
                  className={inputCls}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Type</span>
                <select
                  value={saleSettings.type || "flash"}
                  onChange={(e) =>
                    setSiteAssets({
                      ...siteAssets,
                      globalSale: { ...saleSettings, type: e.target.value as NonNullable<SiteAssets["globalSale"]>["type"] },
                    })
                  }
                  className={inputCls}
                >
                  <option value="flash">Flash</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="holiday">Holiday</option>
                  <option value="clearance">Clearance</option>
                  <option value="blackfriday">Black Friday</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Discount %</span>
                <input
                  type="number"
                  value={saleSettings.discountPercent ?? ""}
                  onChange={(e) =>
                    setSiteAssets({
                      ...siteAssets,
                      globalSale: { ...saleSettings, discountPercent: Number(e.target.value || 0) },
                    })
                  }
                  className={inputCls}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Ends At</span>
                <input
                  type="datetime-local"
                  value={saleSettings.endsAt ? String(saleSettings.endsAt).slice(0, 16) : ""}
                  onChange={(e) =>
                    setSiteAssets({
                      ...siteAssets,
                      globalSale: { ...saleSettings, endsAt: e.target.value },
                    })
                  }
                  className={inputCls}
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={saleSettings.active === true}
                  onChange={(e) =>
                    setSiteAssets({
                      ...siteAssets,
                      globalSale: { ...saleSettings, active: e.target.checked },
                    })
                  }
                />
                Active
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={saleSettings.showBanner !== false}
                  onChange={(e) =>
                    setSiteAssets({
                      ...siteAssets,
                      globalSale: { ...saleSettings, showBanner: e.target.checked },
                    })
                  }
                />
                Show Announcement Bar
              </label>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-mubah-mid/50 bg-mubah-mid/15 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-mubah-orange">Section Visibility</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {sectionOptions.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-mubah-cream">
                  <input
                    type="checkbox"
                    checked={(sectionVisibility as Record<string, boolean | undefined>)[key] !== false}
                    onChange={(e) =>
                      setSiteAssets({
                        ...siteAssets,
                        sectionVisibility: {
                          ...sectionVisibility,
                          [key]: e.target.checked,
                        },
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Quick Shop section (homepage featured products)
  const renderQuickShop = () => {
    const quickShopIds = siteAssets.quickShop?.productIds || [];
    const quickShopEnabled = siteAssets.quickShop?.enabled !== false;
    const availableProducts = products.filter((p) => !quickShopIds.includes(p.id));

    const saveQuickShop = async () => {
      const payload = {
        ...siteAssets,
        quickShop: {
          productIds: quickShopIds,
          enabled: quickShopEnabled,
        },
      };
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify(payload),
      });
      setMessage(res.ok ? "Quick Shop saved" : "Failed to save");
      if (res.ok) {
        setSiteAssets(payload);
      }
    };

    const toggleQuickShop = async (enabled: boolean) => {
      const payload = {
        ...siteAssets,
        quickShop: {
          ...siteAssets.quickShop,
          productIds: quickShopIds,
          enabled,
        },
      };
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSiteAssets(payload);
        setMessage(enabled ? "Quick Shop enabled" : "Quick Shop disabled");
      }
    };

    const addProduct = (productId: string) => {
      const updatedIds = [...quickShopIds, productId];
      setSiteAssets({
        ...siteAssets,
        quickShop: { ...siteAssets.quickShop, productIds: updatedIds, enabled: quickShopEnabled },
      });
    };

    const removeProduct = (productId: string) => {
      const updatedIds = quickShopIds.filter((id) => id !== productId);
      setSiteAssets({
        ...siteAssets,
        quickShop: { ...siteAssets.quickShop, productIds: updatedIds, enabled: quickShopEnabled },
      });
    };

    const moveProduct = (index: number, direction: "up" | "down") => {
      const newIds = [...quickShopIds];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newIds.length) return;
      [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];
      setSiteAssets({
        ...siteAssets,
        quickShop: { ...siteAssets.quickShop, productIds: newIds, enabled: quickShopEnabled },
      });
    };

    const featuredProducts = quickShopIds.map((id) => products.find((p) => p.id === id)).filter((p): p is AdminProduct => p !== undefined);

    return (
      <section className="space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl">Quick Shop Section</h2>
            <p className="text-sm text-mubah-cream/60">
              Manage featured products shown in the homepage Quick Shop grid (replaces category section)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className={quickShopEnabled ? `${ghostBtn} border-green-500 text-green-400` : ghostBtn}
              onClick={() => toggleQuickShop(!quickShopEnabled)}
            >
              {quickShopEnabled ? " Enabled" : "Disabled"}
            </button>
            <button className={orangeBtn} onClick={saveQuickShop}>
              Save changes
            </button>
          </div>
        </div>

        {/* Info card */}
        <div className="rounded-xl border border-mubah-orange/40 bg-mubah-orange/10 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-mubah-orange mb-2"> About Quick Shop</div>
          <p className="text-sm text-mubah-cream/80">
            The Quick Shop section displays a clean 4-column grid of featured products on your homepage (similar to MHN store design).
            Select products below, reorder them, and they'll appear in that order on the homepage. Categories remain accessible in the navbar.
          </p>
        </div>

        {/* Add product selector */}
        {availableProducts.length > 0 && (
          <div className="rounded-xl border border-mubah-mid bg-mubah-mid/20 p-4 space-y-3">
            <div className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70">Add Products to Quick Shop</div>
            <div className="flex flex-wrap gap-2">
              {availableProducts.slice(0, 20).map((product) => (
                <button
                  key={product.id}
                  onClick={(e) => {
                    e.preventDefault();
                    addProduct(product.id);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 text-sm hover:border-mubah-orange hover:bg-mubah-mid/50 transition active:scale-95 min-h-[44px] touch-manipulation"
                >
                  {product.media?.[0]?.src && (
                    <img src={product.media[0].src} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                  )}
                  <span className="line-clamp-1 flex-1 text-left">{product.name}</span>
                  <span className="text-mubah-orange text-lg font-bold flex-shrink-0">+</span>
                </button>
              ))}
            </div>
            {availableProducts.length > 20 && (
              <p className="text-xs text-mubah-cream/50">Showing first 20 products. Use search in Products section to find specific items.</p>
            )}
          </div>
        )}

        {/* Featured products grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm uppercase tracking-[0.14em] text-mubah-cream/70">
              Featured Products ({featuredProducts.length})
            </div>
            {featuredProducts.length > 0 && (
              <button
                className="text-xs text-red-400 hover:text-red-300"
                onClick={() => {
                  if (confirm("Remove all featured products?")) {
                    setSiteAssets({ ...siteAssets, quickShop: { ...siteAssets.quickShop, productIds: [], enabled: quickShopEnabled } });
                  }
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {featuredProducts.length === 0 ? (
            <div className="rounded-xl border border-mubah-mid/40 bg-mubah-mid/10 p-8 text-center">
              <div className="text-4xl mb-3"></div>
              <div className="text-mubah-cream/60">No featured products selected.</div>
              <div className="text-xs text-mubah-cream/40 mt-1">Add products above to get started.</div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="group rounded-xl border border-mubah-mid bg-mubah-mid/10 overflow-hidden transition hover:border-mubah-orange"
                >
                  {/* Product image */}
                  <div className="relative aspect-[3/4] bg-mubah-mid/20">
                    {product.media?.[0]?.src ? (
                      <img src={product.media[0].src} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl"></div>
                    )}
                    {/* Order badge */}
                    <div className="absolute top-2 left-2 rounded-full bg-mubah-orange px-2.5 py-1 text-xs font-bold text-mubah-deep">
                      #{index + 1}
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeProduct(product.id);
                      }}
                      className="absolute top-2 right-2 rounded-full bg-red-500/90 px-2.5 py-1 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600 active:scale-95"
                      title="Remove from Quick Shop"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Product info */}
                  <div className="p-3 space-y-2">
                    <div>
                      <div className="font-semibold text-sm line-clamp-1">{product.name}</div>
                      <div className="text-xs text-mubah-cream/60">{getCategoryLabel(product.category)}</div>
                      <div className="text-xs text-mubah-orange font-semibold">${product.priceUsd}</div>
                    </div>

                    {/* Reorder buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveProduct(index, "up")}
                        disabled={index === 0}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-xs transition ${
                          index === 0
                            ? "bg-mubah-mid/20 text-mubah-cream/30 cursor-not-allowed"
                            : "bg-mubah-mid/40 text-mubah-cream hover:bg-mubah-mid/60"
                        }`}
                      >
                         Move Up
                      </button>
                      <button
                        onClick={() => moveProduct(index, "down")}
                        disabled={index === featuredProducts.length - 1}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-xs transition ${
                          index === featuredProducts.length - 1
                            ? "bg-mubah-mid/20 text-mubah-cream/30 cursor-not-allowed"
                            : "bg-mubah-mid/40 text-mubah-cream hover:bg-mubah-mid/60"
                        }`}
                      >
                         Move Down
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview note */}
        {featuredProducts.length > 0 && (
          <div className="rounded-xl border border-mubah-mid/40 bg-mubah-mid/10 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-mubah-cream/70 mb-2"> Preview</div>
            <p className="text-sm text-mubah-cream/70">
              These {featuredProducts.length} products will display in a responsive grid on your homepage: 1 column on mobile, 2 on tablet, and 4 on desktop.
              Visit your homepage to see them live.
            </p>
          </div>
        )}
      </section>
    );
  };

  // Password/Security section
  const renderPassword = () => (
    <section className="max-w-xl space-y-6">
      <div>
        <h2 className="font-display text-xl">Security Settings</h2>
        <p className="text-sm text-mubah-cream/60 mt-1">Manage your admin login credentials.</p>
      </div>

      <div className="rounded-xl border border-mubah-mid bg-mubah-mid/20 p-4 space-y-4">
        <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Change Admin Password</div>
        <p className="text-xs text-mubah-cream/70">
          Update your admin login password. Minimum 10 characters required.
        </p>
        <div className="space-y-3">
          <Field label="Current Password">
            <input
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              placeholder=""
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
            />
          </Field>
          <Field label="New Password">
            <input
              type="password"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
              placeholder="Minimum 10 characters"
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
            />
          </Field>
          <Field label="Confirm New Password">
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              placeholder="Repeat new password"
              className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2"
            />
          </Field>
        </div>
        {passwordForm.next && passwordForm.confirm && passwordForm.next !== passwordForm.confirm && (
          <p className="text-xs text-red-400">Passwords do not match.</p>
        )}
        {passwordForm.next && passwordForm.next.length < 10 && (
          <p className="text-xs text-amber-400">Password must be at least 10 characters.</p>
        )}
        <button
          className={orangeBtn}
          disabled={passwordChanging || !passwordForm.current || !passwordForm.next || passwordForm.next !== passwordForm.confirm || passwordForm.next.length < 10}
          onClick={async () => {
            setPasswordChanging(true);
            try {
              const res = await fetch("/api/admin/password", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
                body: JSON.stringify({ current: passwordForm.current, next: passwordForm.next }),
              });
              const data = await res.json();
              if (res.ok) {
                setMessage("Password changed successfully! Please log in again.");
                setPasswordForm({ current: "", next: "", confirm: "" });
                await logoutAdmin();
              } else {
                setMessage(data.error || "Failed to change password");
              }
            } catch {
              setMessage("Password change failed");
            } finally {
              setPasswordChanging(false);
            }
          }}
        >
          {passwordChanging ? "Changing..." : "Change Password"}
        </button>
      </div>
    </section>
  );


  // Recycle Bin section
  const renderTrash = () => {
    const restoreEvent = async (id: string) => {
      const res = await fetch(`/api/admin/events?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify({ action: "restore" }),
      });
      if (res.ok) {
        setMessage("Event restored");
        loadDeletedItems();
        loadEvents();
      } else {
        setMessage("Failed to restore event");
      }
    };

    const permanentlyDeleteEvent = async (id: string) => {
      if (!confirm("Permanently delete this event? This cannot be undone.")) return;
      const res = await fetch(`/api/admin/events?id=${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
      });
      if (res.ok) {
        setMessage("Event permanently deleted");
        setDeletedEvents(prev => prev.filter(e => e.id !== id));
      } else {
        setMessage("Failed to delete event");
      }
    };

    const restorePost = async (id: string) => {
      const res = await fetch(`/api/admin/posts?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify({ action: "restore" }),
      });
      if (res.ok) {
        setMessage("Blog post restored");
        loadDeletedItems();
        loadBlogPosts();
      } else {
        setMessage("Failed to restore post");
      }
    };

    const permanentlyDeletePost = async (id: string) => {
      if (!confirm("Permanently delete this blog post? This cannot be undone.")) return;
      const res = await fetch(`/api/admin/posts?id=${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
      });
      if (res.ok) {
        setMessage("Blog post permanently deleted");
        setDeletedPosts(prev => prev.filter(p => p.id !== id));
      } else {
        setMessage("Failed to delete post");
      }
    };

    const restoreReview = async (id: string) => {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
        body: JSON.stringify({ action: "restore" }),
      });
      if (res.ok) {
        setMessage("Review restored");
        loadDeletedItems();
        loadReviews();
      } else {
        setMessage("Failed to restore review");
      }
    };

    const permanentlyDeleteReview = async (id: string) => {
      if (!confirm("Permanently delete this review? This cannot be undone.")) return;
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(storedToken ? { "x-admin-token": storedToken } : {}) },
      });
      if (res.ok) {
        setMessage("Review permanently deleted");
        setDeletedReviews(prev => prev.filter(r => r.id !== id));
      } else {
        setMessage("Failed to delete review");
      }
    };

    const totalDeleted = deletedEvents.length + deletedReviews.length + deletedPosts.length;

    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl">Recycle Bin</h2>
            <p className="text-sm text-mubah-cream/60">
              Deleted items can be restored. {totalDeleted} item{totalDeleted !== 1 ? "s" : ""} in trash.
            </p>
          </div>
          <button className={ghostBtn} onClick={loadDeletedItems} disabled={trashLoading}>
            {trashLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Deleted Events */}
        <div className="rounded-xl border border-mubah-mid bg-mubah-mid/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange"> Deleted Events</div>
            <span className="text-xs text-mubah-cream/60">{deletedEvents.length} items</span>
          </div>
          {deletedEvents.length === 0 ? (
            <p className="text-sm text-mubah-cream/60">No deleted events.</p>
          ) : (
            <div className="space-y-2">
              {deletedEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border border-mubah-mid/40 bg-mubah-mid/15 p-3">
                  <div>
                    <div className="font-medium text-mubah-cream">{event.title}</div>
                    <div className="text-xs text-mubah-cream/60">
                      Deleted: {event.deletedAt ? new Date(event.deletedAt).toLocaleDateString() : "Unknown"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className={orangeBtn} onClick={() => restoreEvent(event.id)}>
                      Restore
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => permanentlyDeleteEvent(event.id)}
                    >
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deleted Blog Posts */}
        <div className="rounded-xl border border-mubah-mid bg-mubah-mid/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange"> Deleted Blog Posts</div>
            <span className="text-xs text-mubah-cream/60">{deletedPosts.length} items</span>
          </div>
          {deletedPosts.length === 0 ? (
            <p className="text-sm text-mubah-cream/60">No deleted blog posts.</p>
          ) : (
            <div className="space-y-2">
              {deletedPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between rounded-lg border border-mubah-mid/40 bg-mubah-mid/15 p-3">
                  <div>
                    <div className="font-medium text-mubah-cream">{post.title || post.slug}</div>
                    <div className="text-xs text-mubah-cream/60 line-clamp-1">{post.excerpt || "No excerpt"}</div>
                    <div className="text-xs text-mubah-cream/40">
                      Deleted: {post.deletedAt ? new Date(post.deletedAt).toLocaleDateString() : "Unknown"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className={orangeBtn} onClick={() => restorePost(post.id)}>
                      Restore
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => permanentlyDeletePost(post.id)}
                    >
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deleted Reviews */}
        <div className="rounded-xl border border-mubah-mid bg-mubah-mid/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange"> Deleted Reviews</div>
            <span className="text-xs text-mubah-cream/60">{deletedReviews.length} items</span>
          </div>
          {deletedReviews.length === 0 ? (
            <p className="text-sm text-mubah-cream/60">No deleted reviews.</p>
          ) : (
            <div className="space-y-2">
              {deletedReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between rounded-lg border border-mubah-mid/40 bg-mubah-mid/15 p-3">
                  <div>
                    <div className="font-medium text-mubah-cream">{review.author} ({review.rating})</div>
                    <div className="text-xs text-mubah-cream/60 line-clamp-1">{review.text}</div>
                    <div className="text-xs text-mubah-cream/40">
                      Deleted: {review.deletedAt ? new Date(review.deletedAt).toLocaleDateString() : "Unknown"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className={orangeBtn} onClick={() => restoreReview(review.id)}>
                      Restore
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => permanentlyDeleteReview(review.id)}
                    >
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <main className="min-h-screen bg-mubah-deep text-mubah-cream flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <div className="animate-pulse text-mubah-orange text-2xl"></div>
          <div className="text-mubah-cream/60 text-sm">Checking session...</div>
        </div>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-mubah-deep text-mubah-cream flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-6">
          <h1 className="text-xl font-semibold">Admin Login</h1>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter admin password"
            className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 text-mubah-cream"
          />
          <button
            onClick={async () => {
              const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: token }),
              });
              if (res.ok) {
                setAuthed(true);
                setMessage("Logged in");
              } else if (res.status === 403) {
                setMessage("Password expired. Rotate required.");
              } else {
                setMessage("Login failed");
              }
              setToken("");
            }}
            className="w-full rounded-full bg-mubah-orange px-4 py-2 text-mubah-deep font-semibold"
          >
            Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mubah-deep text-mubah-cream flex">
      {renderSidebar()}
      {renderMobileNav()}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {renderTopBar()}
        <div className="space-y-4 p-4">
          {activeSection === "dashboard" && renderDashboard()}
          {activeSection === "categories" && renderCategories()}
          {activeSection === "products" && renderProducts()}
          {activeSection === "currency" && renderCurrency()}
          {activeSection === "media" && renderMedia()}
          {activeSection === "orders" && renderOrders()}
          {activeSection === "giftCards" && renderGiftCards()}
          {activeSection === "forms" && renderForms()}
          {activeSection === "events" && renderEvents()}
          {activeSection === "reviews" && renderReviews()}
          {activeSection === "users" && renderUsers()}
          {activeSection === "partners" && renderPartners()}
          {activeSection === "signatureCuts" && renderSignatureCutsManagement()}
          {activeSection === "instagramFeed" && renderInstagramManagement()}
          {activeSection === "editorialCustomers" && renderEditorialManagement()}
          {activeSection === "storefrontControls" && renderStorefrontControls()}
          {activeSection === "quickshop" && renderQuickShop()}
          {activeSection === "password" && renderPassword()}
          {activeSection === "trash" && renderTrash()}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        onChange={(e) => onUploadMedia(e.target.files)}
      />
      <input
        ref={sectionAssetInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        onChange={(e) => handleSectionAssetUpload(e.target.files)}
      />

      {message && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-4 lg:bottom-4 flex items-center gap-3 rounded-xl border border-mubah-mid bg-mubah-mid/80 px-4 py-3 text-sm shadow-[var(--shadow-card)]">
          <span>{message}</span>
          <button className="text-xs text-mubah-orange" onClick={() => setMessage("")}>
            Dismiss
          </button>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingProduct(null)}
          />
          <div className="relative flex h-full w-full max-w-5xl flex-col border-l border-mubah-mid/70 bg-mubah-mid/30 shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between border-b border-mubah-mid/70 px-4 py-4 md:px-6">
              <div className="text-sm uppercase tracking-[0.18em] text-mubah-orange">Edit product</div>
              <button
                className="text-sm text-mubah-cream/70 hover:text-mubah-orange"
                onClick={() => setEditingProduct(null)}
                type="button"
              >
                Close
              </button>
            </div>
            {/* Mobile horizontal step tabs */}
            <div className="flex overflow-x-auto border-b border-mubah-mid/60 bg-mubah-mid/25 px-3 py-2 gap-2 md:hidden">
              {steps.map((step) => (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActiveStep(step.key)}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-sm transition touch-manipulation min-h-[40px] ${activeStep === step.key
                    ? "bg-mubah-orange text-mubah-deep font-medium"
                    : "bg-mubah-mid/30 text-mubah-cream/80 active:bg-mubah-mid/50"
                    }`}
                >
                  {step.label}
                </button>
              ))}
            </div>
            <div className="flex flex-1 overflow-hidden">
              {/* Desktop vertical step navigation */}
              <div className="hidden w-48 flex-shrink-0 flex-col gap-3 border-r border-mubah-mid/60 bg-mubah-mid/25 px-4 py-5 md:flex">
                {steps.map((step) => (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setActiveStep(step.key)}
                    className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${activeStep === step.key ? "bg-mubah-cream text-mubah-deep" : "text-mubah-cream/80 hover:bg-mubah-mid/30"
                      }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${activeStep === step.key ? "bg-mubah-deep" : "bg-mubah-cream/60"
                        }`}
                    />
                    <span>{step.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 space-y-6">
                {activeStep === "basics" && renderBasicsSection()}
                {activeStep === "story" && renderStorySection()}
                {activeStep === "size" && renderSizeSection()}
                {activeStep === "media" && renderMediaSection()}
                {activeStep === "visibility" && renderVisibilitySection()}
                {activeStep === "relations" && renderRelationsStep()}
                <button
                  type="button"
                  className="text-sm text-mubah-orange hover:text-mubah-orange-alt"
                  onClick={() => {
                    const order: ("basics" | "story" | "size" | "media" | "visibility" | "relations")[] = ["basics", "story", "size", "media", "visibility", "relations"];
                    const idx = order.indexOf(activeStep);
                    setActiveStep(order[(idx + 1) % order.length]);
                  }}
                >
                  Next section 
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-mubah-mid/70 bg-mubah-mid/40 px-4 py-3 md:px-6">
              <span className="text-xs text-mubah-cream/70">Last saved: {lastSaved}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={orangeBtn}
                  onClick={() => editingProduct && saveProduct(editingProduct)}
                >
                  Save changes
                </button>
                <button
                  type="button"
                  className={ghostBtn}
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      {imageEditorOpen && imageEditorSrc && (
        <ImageEditor
          src={getProxiedUrl(imageEditorSrc) || imageEditorSrc}
          initialSettings={imageEditorAssetKey ? {
            src: imageEditorSrc,
            scale: siteAssets.imageDisplaySettings?.[imageEditorAssetKey]?.scale ?? 100,
            positionX: siteAssets.imageDisplaySettings?.[imageEditorAssetKey]?.positionX ?? 50,
            positionY: siteAssets.imageDisplaySettings?.[imageEditorAssetKey]?.positionY ?? 50,
            fit: siteAssets.imageDisplaySettings?.[imageEditorAssetKey]?.fit ?? "cover",
          } : undefined}
          onClose={() => setImageEditorOpen(false)}
          onSave={(settings) => {
            if (imageEditorCallback) {
              imageEditorCallback(settings);
            }
            setImageEditorOpen(false);
          }}
        />
      )}
    </main>
  );
}

function toTitle(input: string) {
  return input
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function labelize(section: string) {
  if (section === "media") return "Media Library";
  if (section === "currency") return "Currency";
  if (section === "giftCards") return "Gift Cards";
  if (section === "quickshop") return "Quick Shop";
  if (section === "storefrontControls") return "Storefront Controls";
  return toTitle(section);
}
function FormErrorList({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return (
    <ul className="rounded-lg border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-100">
      {errors.map((err, idx) => (
        <li key={idx}> {err}</li>
      ))}
    </ul>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.14em] text-mubah-cream/70">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-mubah-cream/60">{children}</p>;
}

function QuickInfoRow({
  label,
  value,
  onChange,
  onDelete,
}: {
  label: string;
  value: string;
  onChange: (next: { label: string; value: string }) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-mubah-mid bg-mubah-mid/30 p-3 sm:flex-row sm:items-center sm:gap-3">
      <input
        value={label}
        onChange={(e) => onChange({ label: e.target.value, value })}
        placeholder="Label"
        className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/40 px-3 py-2 text-sm text-mubah-cream min-h-[48px]"
        style={{ flex: 1 }}
      />
      <input
        value={value}
        onChange={(e) => onChange({ label, value: e.target.value })}
        placeholder="Value"
        className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/40 px-3 py-2 text-sm text-mubah-cream min-h-[48px]"
        style={{ flex: 1 }}
      />
      <button
        className="text-sm text-red-200 hover:text-red-300"
        onClick={onDelete}
        aria-label="Delete row"
      >
        
      </button>
    </div>
  );
}



