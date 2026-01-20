import ApiService from './api';

class PaymentService {
  constructor() {
    this.api = ApiService;
  }

  /**
   * Create Razorpay order
   * @param {string} applicationId - Tax form application ID
   * @param {number} amount - Payment amount (optional, will use application's paymentAmount if not provided)
   * @param {string} token - User authentication token
   * @returns {Promise<Object>} Order details with order ID and key_id
   */
  async createOrder(applicationId, amount, token) {
    try {
      console.log('💳 Creating Razorpay order for application:', applicationId);
      
      const response = await this.api.makeRequest('/payment/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId: applicationId,
          amount: amount
        })
      });

      console.log('✅ Razorpay order created successfully');
      return response;
    } catch (error) {
      console.error('❌ Create order error:', error);
      throw error;
    }
  }

  /**
   * Verify Razorpay payment
   * @param {string} applicationId - Tax form application ID
   * @param {string} razorpay_order_id - Razorpay order ID
   * @param {string} razorpay_payment_id - Razorpay payment ID
   * @param {string} razorpay_signature - Razorpay payment signature
   * @param {string} token - User authentication token
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(applicationId, razorpay_order_id, razorpay_payment_id, razorpay_signature, token) {
    try {
      console.log('🔐 Verifying Razorpay payment...');
      
      const response = await this.api.makeRequest('/payment/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId: applicationId,
          razorpay_order_id: razorpay_order_id,
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature
        })
      });

      console.log('✅ Payment verified successfully');
      return response;
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      throw error;
    }
  }

  /**
   * Verify Razorpay payment by URL (when handler doesn't fire)
   * Backend will fetch payment details from Razorpay and verify
   * @param {string} applicationId - Tax form application ID
   * @param {string} razorpay_order_id - Razorpay order ID
   * @param {string} razorpay_payment_id - Razorpay payment ID
   * @param {string} token - User authentication token
   * @returns {Promise<Object>} Verification result
   */
  async verifyPaymentByUrl(applicationId, razorpay_order_id, razorpay_payment_id, token) {
    try {
      console.log('🔐 Verifying Razorpay payment by URL...');
      
      const response = await this.api.makeRequest('/payment/verify-by-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId: applicationId,
          razorpay_order_id: razorpay_order_id,
          razorpay_payment_id: razorpay_payment_id
        })
      });

      console.log('✅ Payment verified successfully (by URL)');
      return response;
    } catch (error) {
      console.error('❌ Payment verification error (by URL):', error);
      throw error;
    }
  }
}

export default new PaymentService();


