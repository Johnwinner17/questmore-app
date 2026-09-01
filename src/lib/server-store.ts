import {
  mockCategories,
  mockSubcategories,
  mockServices,
  mockProfessions,
  mockBanners,
  mockReviews,
  mockGalleryItems,
  mockUsers,
  mockFaqs,
  mockAreas,
} from "@/lib/mock-data";

interface ServerStore {
  requests: any[];
  notifications: any[];
  gallery: any[];
  services: any[];
  categories: any[];
  subcategories: any[];
  professions: any[];
  banners: any[];
  reviews: any[];
  users: any[];
  faqs: any[];
  areas: any[];
  bookingFee: number;
}

const globalForStore = globalThis as typeof globalThis & {
  __questmore_server_store?: ServerStore;
};

export const serverStore: ServerStore =
  globalForStore.__questmore_server_store ?? {
    requests: [],
    notifications: [],
    gallery: [...mockGalleryItems],
    services: [...mockServices],
    categories: [...mockCategories],
    subcategories: [...mockSubcategories],
    professions: [...mockProfessions],
    banners: [...mockBanners],
    reviews: [...mockReviews],
    users: [],
    faqs: [...mockFaqs],
    areas: [...mockAreas],
    bookingFee: 5000,
  };

globalForStore.__questmore_server_store = serverStore;
