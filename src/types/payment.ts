export type PaymentMethodType = 'cod' | 'ewallet' | 'card' | 'bank_transfer' | 'qr';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  icon: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  metadata: Record<string, string>; // card last4, wallet name, etc.
}

export type TransactionStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  status: TransactionStatus;
  providerTransactionId: string;
  providerName: string;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  failureReason: string | null;
}
