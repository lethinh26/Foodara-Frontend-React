import { Banknote, QrCode } from 'lucide-react';
import { delay } from '../utils/helpers';
import type { PaymentMethod, PaymentTransaction } from '../types/payment';

const paymentMethod: PaymentMethod[] = [
  { id: 'pm-cod', type: 'cod', name: 'Tiền mặt', icon: Banknote, description: 'Thanh toán khi nhận hàng', isDefault: true, isActive: true, metadata: {} },
  { id: 'pm-qr', type: 'qr', name: 'Quét mã QR', icon: QrCode, description: 'Thanh toán bằng mã QR qua app ngân hàng', isDefault: false, isActive: true, metadata: {} },
];

export const paymentService = {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    await delay(400);
    return paymentMethod;
  },

  async processPayment(orderId: string, method: string, amount: number): Promise<PaymentTransaction> {
    await delay(1500);
    const shouldFail = Math.random() < 0.1;
    const transaction: PaymentTransaction = {
      id: 'txn-' + Date.now(),
      orderId,
      amount,
      currency: 'VND',
      method: method as PaymentTransaction['method'],
      status: shouldFail ? 'failed' : 'success',
      providerTransactionId: 'PVD-' + Date.now(),
      providerName: method === 'cod' ? 'COD' : 'VNPay',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: shouldFail ? null : new Date().toISOString(),
      failureReason: shouldFail ? 'Giao dịch bị từ chối bởi ngân hàng' : null,
    };
    if (shouldFail) throw new Error(transaction.failureReason!);
    return transaction;
  },

  async retryPayment(transactionId: string): Promise<PaymentTransaction> {
    await delay(1200);
    return {
      id: transactionId,
      orderId: 'ord-retry',
      amount: 0,
      currency: 'VND',
      method: 'qr',
      status: 'success',
      providerTransactionId: 'PVD-RETRY-' + Date.now(),
      providerName: 'VNPay',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      failureReason: null,
    };
  },
};
