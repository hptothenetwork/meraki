export type Price = {
  amount: number;
  currency: string;
};

export type ProductMedia = {
  src: string;
  alt: string;
};

export type ColorOption = {
  name: string;
  swatch: string;
};

export type RelatedItem = {
  id: string;
  name: string;
  priceUsd: number;
  image: string;
};

export type QuickInfo = {
  label: string;
  value: string;
};

export type SizeStock = {
  size: string;
  stock: number;
  preorder?: boolean;
  availableDate?: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  badge?: string;
  subtitle: string;
  description?: string;
  priceUsd: number;
  stock?: number;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock" | "preorder";
  sizeStock?: SizeStock[];
  features: string[];
  media: ProductMedia[];
  fallbackImage?: string;
  fit: string;
  sizeGuide: string[];
  fabric: string;
  care: string[];
  shipping: string;
  sustainability?: string;
  quickInfo: QuickInfo[];
  colors: ColorOption[];
  related: RelatedItem[];
  styling: RelatedItem[];
  fbt?: RelatedItem[];
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

export type CurrencyRate = {
  base: string;
  target: string;
  rate: number;
  source?: string;
  updatedAt: string;
  pairId?: string;
};

export type ImageDisplaySettings = {
  scale?: number;
  positionX?: number;
  positionY?: number;
  fit?: "cover" | "contain" | "fill";
};

export type SectionImageItem = {
  src: string;
  type?: "image" | "video";
  alt?: string;
  isDefault?: boolean;
};

export type Partner = {
  name: string;
  logo: string;
  website?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge'; // Image size: small=12, medium=16, large=20, xlarge=24 (h-units)
};

export type SignatureCut = {
  id: string;
  title: string;
  copy: string;
  image: string;
  slug: string;
  order?: number;
};

export type InstagramPhoto = {
  id: string;
  imageUrl: string;
  caption?: string;
  link?: string;
  order?: number;
};

export type EditorialPhoto = {
  id: string;
  imageUrl: string;
  caption?: string;
  span?: string; // grid span class
  height?: number;
  offset?: string; // transform offset
  order?: number;
};

export type SiteAssets = {
  productDescriptionImage?: string | string[];
  pdfSlides?: string[];
  placeholders?: {
    productDefault?: string;
    productByCategory?: Record<string, string>;
    socialFallback?: string;
    orderItemFallback?: string;
    eventFallback?: string;
  };
  sectionImages?: {
    heroMain?: string | string[] | SectionImageItem[];
    heroFullscreen?: string | string[] | SectionImageItem[];
    aboutMubah?: string | string[] | SectionImageItem[];
    materialTexture?: string | string[] | SectionImageItem[];
    productEditorial?: string | string[] | SectionImageItem[];
    contactHero?: string | string[] | SectionImageItem[];
    contactStudio?: string | string[] | SectionImageItem[];
    signatureCuts?: Partial<Record<"relaxedFit" | "tropicalUrban" | "campShirt" | "linenSets", string | string[] | SectionImageItem[]>>;
    instagramStrip?: string[];
    editorialCustomers?: string[];
    lengthGuide?: Record<string, { front?: string | string[] | SectionImageItem[]; back?: string | string[] | SectionImageItem[] }>;
  };
  // Display settings for images (scale, position, fit)
  imageDisplaySettings?: Record<string, ImageDisplaySettings>;
  // Global sale/promotion settings
  globalSale?: {
    active?: boolean;
    type?: "clearance" | "blackfriday" | "holiday" | "flash" | "seasonal" | "";
    label?: string; // e.g., "BLACK FRIDAY SALE - UP TO 50% OFF"
    discountPercent?: number; // e.g., 20 for 20% off
    showBanner?: boolean; // Show banner on landing page
    showNavbar?: boolean; // Show indicator in navbar
    endsAt?: string; // ISO date string
  };
  // Contact and WhatsApp settings
  contact?: {
    whatsappNumber?: string;
    phone?: string;
    email?: string;
    studio?: string;
    enableCustomCutsForm?: boolean;
  };
  // Partners for homepage carousel
  partners?: Partner[];
  // Signature Cuts - dynamic editable sections
  signatureCuts?: SignatureCut[];
  // Instagram Feed photos - dynamic
  instagramPhotos?: InstagramPhoto[];
  // Editorial Customers photos - dynamic
  editorialPhotos?: EditorialPhoto[];
  // Quick Shop featured products
  quickShop?: {
    productIds?: string[];
    enabled?: boolean;
  };
  // Section visibility controls
  sectionVisibility?: {
    hero?: boolean;
    quickShop?: boolean;
    signatureCuts?: boolean;
    aboutMubah?: boolean;
    customerReviews?: boolean;
    editorialCustomers?: boolean;
    materialTexture?: boolean;
    brandValues?: boolean;
    eventsPreview?: boolean;
    partners?: boolean;
    instagramFeed?: boolean;
    newsletter?: boolean;
    [key: string]: boolean | undefined;
  };
};
