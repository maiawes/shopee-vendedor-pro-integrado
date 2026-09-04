import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebaseDb } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FirebaseProduct {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  volume?: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  averageBaseCost?: number;
  averageCost: number;
  suggestedPrice: number;
  currentStock: number;
  minimumStock: number;
  status?: string;
  createdAt?: string;
  notes?: string;
}

export interface FirebaseSaleItem {
  id?: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  averageCost?: number;
  costOfGoods?: number;
}

export interface FirebaseSale {
  id: string;
  date: string;
  customerName?: string;
  items: FirebaseSaleItem[];
  total: number;
  costOfGoods: number;
  linkedCosts?: number;
  packagingCost?: number;
  shopeeFee?: number;
  grossProfit: number;
  margin: number;
  paymentMethod?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FirebasePurchase {
  id: string;
  date?: string;
  supplierName?: string;
  items?: Array<{ productId?: string; productName?: string; quantity: number; unitCost: number; subtotal?: number }>;
  totalCost: number;
  status?: string;
  createdAt?: string;
}

export interface FirebaseStockMovement {
  id: string;
  productId: string;
  productName: string;
  type: string;
  quantity: number;
  previousStock?: number;
  newStock?: number;
  reason?: string;
  date: string;
  createdAt?: string;
}

export interface FirebaseSupplier {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  status?: string;
  createdAt?: string;
}

export interface FirebaseExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  status?: string;
}

export interface FirebaseData {
  products: FirebaseProduct[];
  sales: FirebaseSale[];
  purchases: FirebasePurchase[];
  stockMovements: FirebaseStockMovement[];
  suppliers: FirebaseSupplier[];
  expenses: FirebaseExpense[];
}

const EMPTY_DATA: FirebaseData = {
  products: [], sales: [], purchases: [], stockMovements: [], suppliers: [], expenses: [],
};

function toNumber(value: unknown, fallback = 0): number {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function toIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date(0).toISOString();
}

function normalizeDoc<T extends Record<string, unknown>>(id: string, raw: Record<string, unknown>): T {
  return { id, ...raw } as T;
}

async function listOwned<T extends Record<string, unknown>>(collectionName: string, userId: string): Promise<T[]> {
  const snapshot = await getDocs(query(collection(firebaseDb, collectionName), where("ownerId", "==", userId)));
  return snapshot.docs.map((item) => normalizeDoc<T>(item.id, item.data() as Record<string, unknown>));
}

function normalizeProducts(rows: Array<Record<string, unknown>>): FirebaseProduct[] {
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "Produto sem nome"),
    brand: row.brand ? String(row.brand) : undefined,
    category: row.category ? String(row.category) : undefined,
    volume: row.volume ? String(row.volume) : undefined,
    sku: row.sku ? String(row.sku) : undefined,
    barcode: row.barcode ? String(row.barcode) : undefined,
    imageUrl: row.imageUrl ? String(row.imageUrl) : undefined,
    averageBaseCost: toNumber(row.averageBaseCost),
    averageCost: toNumber(row.averageCost),
    suggestedPrice: toNumber(row.suggestedPrice),
    currentStock: toNumber(row.currentStock),
    minimumStock: toNumber(row.minimumStock, 3),
    status: row.status ? String(row.status) : "active",
    createdAt: row.createdAt ? toIso(row.createdAt) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  }));
}

function normalizeSales(rows: Array<Record<string, unknown>>): FirebaseSale[] {
  return rows.map((row) => ({
    id: String(row.id),
    date: row.date ? toIso(row.date) : toIso(row.createdAt),
    customerName: row.customerName ? String(row.customerName) : "Consumidor final",
    items: Array.isArray(row.items) ? row.items.map((item) => {
      const data = (item ?? {}) as Record<string, unknown>;
      return {
        id: data.id ? String(data.id) : undefined,
        productId: data.productId ? String(data.productId) : undefined,
        productName: String(data.productName ?? "Produto"),
        quantity: toNumber(data.quantity, 1),
        unitPrice: toNumber(data.unitPrice),
        total: toNumber(data.total),
        averageCost: toNumber(data.averageCost),
        costOfGoods: toNumber(data.costOfGoods),
      };
    }) : [],
    total: toNumber(row.total),
    costOfGoods: toNumber(row.costOfGoods),
    linkedCosts: toNumber(row.linkedCosts),
    packagingCost: toNumber(row.packagingCost),
    shopeeFee: toNumber(row.shopeeFee),
    grossProfit: toNumber(row.grossProfit),
    margin: toNumber(row.margin),
    paymentMethod: row.paymentMethod ? String(row.paymentMethod) : undefined,
    status: row.status ? String(row.status) : "paid",
    createdAt: row.createdAt ? toIso(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? toIso(row.updatedAt) : undefined,
  }));
}

function normalizePurchases(rows: Array<Record<string, unknown>>): FirebasePurchase[] {
  return rows.map((row) => ({
    id: String(row.id),
    date: row.date ? toIso(row.date) : undefined,
    supplierName: row.supplierName ? String(row.supplierName) : undefined,
    items: Array.isArray(row.items) ? row.items.map((item) => {
      const data = (item ?? {}) as Record<string, unknown>;
      return { productId: data.productId ? String(data.productId) : undefined, productName: data.productName ? String(data.productName) : undefined, quantity: toNumber(data.quantity, 1), unitCost: toNumber(data.unitCost), subtotal: toNumber(data.subtotal) };
    }) : [],
    totalCost: toNumber(row.totalCost),
    status: row.status ? String(row.status) : "paid",
    createdAt: row.createdAt ? toIso(row.createdAt) : undefined,
  }));
}

function normalizeMovements(rows: Array<Record<string, unknown>>): FirebaseStockMovement[] {
  return rows.map((row) => ({
    id: String(row.id),
    productId: String(row.productId ?? ""),
    productName: String(row.productName ?? "Produto"),
    type: String(row.type ?? "manual_positive"),
    quantity: toNumber(row.quantity),
    previousStock: toNumber(row.previousStock),
    newStock: toNumber(row.newStock),
    reason: row.reason ? String(row.reason) : undefined,
    date: row.date ? toIso(row.date) : toIso(row.createdAt),
    createdAt: row.createdAt ? toIso(row.createdAt) : undefined,
  }));
}

function normalizeSuppliers(rows: Array<Record<string, unknown>>): FirebaseSupplier[] {
  return rows.map((row) => ({
    id: String(row.id), name: String(row.name ?? "Fornecedor"), document: row.document ? String(row.document) : undefined,
    phone: row.phone ? String(row.phone) : undefined, whatsapp: row.whatsapp ? String(row.whatsapp) : undefined,
    email: row.email ? String(row.email) : undefined, address: row.address ? String(row.address) : undefined,
    status: row.status ? String(row.status) : "active", createdAt: row.createdAt ? toIso(row.createdAt) : undefined,
  }));
}

function normalizeExpenses(rows: Array<Record<string, unknown>>): FirebaseExpense[] {
  return rows.map((row) => ({ id: String(row.id), date: row.date ? toIso(row.date) : toIso(row.createdAt), description: String(row.description ?? "Despesa"), amount: toNumber(row.amount), category: row.category ? String(row.category) : undefined, status: row.status ? String(row.status) : undefined }));
}

async function fetchData(userId: string): Promise<FirebaseData> {
  const [products, sales, purchases, stockMovements, suppliers, expenses] = await Promise.all([
    listOwned<Record<string, unknown>>("products", userId),
    listOwned<Record<string, unknown>>("sales", userId),
    listOwned<Record<string, unknown>>("purchases", userId),
    listOwned<Record<string, unknown>>("stockMovements", userId),
    listOwned<Record<string, unknown>>("suppliers", userId),
    listOwned<Record<string, unknown>>("expenses", userId),
  ]);
  return {
    products: normalizeProducts(products),
    sales: normalizeSales(sales).sort((a, b) => b.date.localeCompare(a.date)),
    purchases: normalizePurchases(purchases).sort((a, b) => String(b.date).localeCompare(String(a.date))),
    stockMovements: normalizeMovements(stockMovements).sort((a, b) => b.date.localeCompare(a.date)),
    suppliers: normalizeSuppliers(suppliers).sort((a, b) => a.name.localeCompare(b.name)),
    expenses: normalizeExpenses(expenses).sort((a, b) => b.date.localeCompare(a.date)),
  };
}

export function useFirebaseData() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["firebase-data", user?.id],
    queryFn: () => fetchData(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
  return { ...(query.data ?? EMPTY_DATA), isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}
