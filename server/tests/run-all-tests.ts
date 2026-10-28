import { runEntitlementUnitTests } from './unit/entitlement.test.js';
import { runPaymentWebhookUnitTests } from './unit/payment-webhook.test.js';
import { runPurchaseFlowE2ETest } from './e2e/purchase-flow.test.js';

async function runAllTests() {
  console.log('================================================================');
  console.log('  WHALE / SHANHAI STUDIO - BỘ KIỂM THỬ BACKEND TOÀN DIỆN (PHASE 4)');
  console.log('================================================================');

  const startTime = Date.now();

  try {
    // 1. Chạy Unit Test Phân quyền / Entitlement
    await runEntitlementUnitTests();

    // 2. Chạy Unit Test Webhook Thanh toán & Idempotency
    await runPaymentWebhookUnitTests();

    // 3. Chạy E2E Test Luồng Mua -> Truy cập -> Hoàn tiền -> Mất quyền
    await runPurchaseFlowE2ETest();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n================================================================');
    console.log(`✨ TẤT CẢ 3 BỘ TEST ĐÃ HOÀN TẤT THÀNH CÔNG RỰC RỠ TRONG ${duration}s!`);
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n❌ KIỂM THỬ THẤT BẠI:', error);
    process.exit(1);
  }
}

runAllTests();
