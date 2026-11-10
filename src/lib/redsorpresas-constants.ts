export interface Prize {
  id: string;
  name: string;
  type: 'discount' | 'cashback' | 'freeshipping' | 'product' | 'voucher' | 'raffle' | 'empty';
  weight: number; 
  color: string;
  value?: number;
  description?: string;
}

export interface SpinResult {
  userId: string;
  prizeId: string;
  prizeName: string;
  timestamp: string;
  redeemed: boolean;
}

// Fallback Default Prizes (80% low, 15% mid, 5% high)
export const DEFAULT_PRIZES: Prize[] = [
  { id: '1', name: '$1000', type: 'cashback', weight: 40, color: '#FF5733', value: 1000 },
  { id: 'cepita1', name: 'Jugo CEPITA de 200 ml', type: 'product', weight: 60, color: '#64748B' },
  { id: '2', name: '$2000', type: 'cashback', weight: 30, color: '#FF8C00', value: 2000 },
  { id: '3', name: 'Coca Cola 500ml + Cheetos', type: 'product', weight: 30, color: '#E82A4D' },
  { id: '4', name: '$3000', type: 'cashback', weight: 15, color: '#009EE3', value: 3000 },
  { id: '5', name: 'Fanta 500ml + Potatos', type: 'product', weight: 30, color: '#F59E0B' },
  { id: '6', name: '$4000', type: 'cashback', weight: 10, color: '#3357FF', value: 4000 },
  { id: 'cepita2', name: 'Jugo CEPITA de 200 ml', type: 'product', weight: 60, color: '#475569' },
  { id: '7', name: '$5000', type: 'cashback', weight: 5, color: '#6B38FB', value: 5000 },
  { id: '8', name: 'Coca Cola 500ml', type: 'product', weight: 40, color: '#E82A4D' },
  { id: '9', name: 'Pava Eléctrica', type: 'product', weight: 2, color: '#E82A4D' },
  { id: 'cepita3', name: 'Jugo CEPITA de 200 ml', type: 'product', weight: 60, color: '#475569' },
  { id: '10', name: 'Licuadora', type: 'product', weight: 1, color: '#10B981' },
  { id: '11', name: 'Producto a Elección', type: 'product', weight: 10, color: '#A833FF' },
  { id: '12', name: 'Bici Venzo', type: 'product', weight: 0.5, color: '#FF6B35' },
  { id: 'cepita4', name: 'Jugo CEPITA de 200 ml', type: 'product', weight: 60, color: '#475569' },
  { id: '13', name: 'Cheque $50K', type: 'voucher', weight: 0.2, color: '#F59E0B', value: 50000 },
  { id: 'cepita5', name: 'Jugo CEPITA de 200 ml', type: 'product', weight: 60, color: '#64748B' },
  { id: '14', name: 'Cheque $100K', type: 'voucher', weight: 0.05, color: '#A833FF', value: 100000 },
  { id: 'cepita6', name: 'Jugo CEPITA de 200 ml', type: 'product', weight: 60, color: '#475569' },
  { id: '15', name: 'Moto 110cc', type: 'product', weight: 0.01, color: '#111827' },
];
