export type OwnerRole = 'retailer' | 'wholesaler';

export type InvoiceType = 'A' | 'B' | 'C' | 'REMITO' | 'PRESUPUESTO';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL';
export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'CTA_CTE';

export interface SupplierItem {
  id: string;
  ownerId: string;
  ownerRole: OwnerRole;
  name: string; // Razón Social / Nombre Comercial
  cuit?: string;
  phone?: string;
  email?: string;
  address?: string;
  category?: string; // Rubro (ej: Lácteos, Bebidas, Limpieza, etc.)
  creditLimit?: number; // Límite de crédito otorgado en pesos
  creditDays?: number; // Días de plazo habitual (ej: 15, 30, 45 días)
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface PurchaseInvoiceItemProduct {
  productId?: string;
  code?: string;
  name: string;
  quantity: number;
  costPrice: number;
  margin?: number; // Added to handle profit margin percentage
  salePrice?: number; // Added to allow setting selling price from invoice
  subtotal: number;
}

export interface PurchaseInvoice {
  id: string;
  ownerId: string;
  ownerRole: OwnerRole;
  supplierId: string;
  supplierName: string;
  supplierCuit?: string;
  invoiceType: InvoiceType;
  invoiceNumber: string; // ej: 0001-00045231
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD (fecha límite de pago)
  items: PurchaseInvoiceItemProduct[];
  subtotal: number;
  taxAmount?: number; // IVA u otros impuestos
  totalAmount: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  remainingAmount: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  updatedStock?: boolean; // si impactó en el inventario
  recordType?: string; // para multiplexar en retailer_daily_operations
  createdAt: any;
  updatedAt?: any;
}

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ExpansionProject {
  id: string;
  ownerId: string;
  ownerRole: OwnerRole;
  name: string; // ej: "Sucursal 2 - Macro Centro" o "Depósito Norte - Galpón 3"
  description?: string;
  location?: string;
  targetOpeningDate?: string; // YYYY-MM-DD
  budgetTotal: number; // Presupuesto estimado inicial
  totalSpent: number; // Suma acumulada de gastos
  projectedMonthlyProfit?: number; // Ganancia neta proyectada por mes de la sucursal para calcular payback
  status: ProjectStatus;
  sharedNotes?: string;
  tasks?: ProjectTask[];
  recordType?: string; // Para multiplexar
  createdAt: any;
  updatedAt?: any;
}

export type ExpenseCategory = 
  | 'ALQUILER_DEPOSITO' 
  | 'OBRAS_REMODELACION' 
  | 'EQUIPAMIENTO' 
  | 'STOCK_INICIAL' 
  | 'HABILITACIONES_LEGALES' 
  | 'MARKETING_CARTELERIA' 
  | 'OTROS';

export interface ProjectExpense {
  id: string;
  projectId: string;
  ownerId: string;
  ownerRole: OwnerRole;
  concept: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  supplierName?: string;
  invoiceNumber?: string;
  paid: boolean;
  notes?: string;
  createdAt: any;
}
