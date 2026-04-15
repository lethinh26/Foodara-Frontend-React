import { delay } from '../utils/helpers';
import type { PaymentMethod, PaymentTransaction } from '../types/payment';

const mockPaymentMethods: PaymentMethod[] = [
  { id: 'pm-1', type: 'cod', name: 'Thanh toán khi nhận hàng', icon: 'Banknote', description: 'Trả tiền mặt khi nhận', isDefault: true, isActive: true, metadata: {} },
  { id: 'pm-2', type: 'ewallet', name: 'Ví MoMo', icon: 'Wallet', description: 'Thanh toán qua ví MoMo', isDefault: false, isActive: true, metadata: { walletName: 'MoMo' } },
  { id: 'pm-3', type: 'card', name: 'Thẻ Visa ****1234', icon: 'CreditCard', description: 'Thẻ tín dụng Visa', isDefault: false, isActive: true, metadata: { last4: '1234', brand: 'Visa' } },
  { id: 'pm-4', type: 'bank_transfer', name: 'Chuyển khoản ngân hàng', icon: 'Building2', description: 'Chuyển khoản qua app ngân hàng', isDefault: false, isActive: true, metadata: {} },
  { id: 'pm-5', type: 'qr', name: 'Quét mã QR (VNPay)', icon: 'QrCode', description: 'Quét mã QR để thanh toán', isDefault: false, isActive: true, metadata: {} },
];

export const paymentService = {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    await delay(400);
    return mockPaymentMethods;
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
      method: 'ewallet',
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
