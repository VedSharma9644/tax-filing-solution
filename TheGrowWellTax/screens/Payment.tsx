import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { useAuth } from '../contexts/AuthContext';
import { BackgroundColors } from '../utils/colors';
import PaymentService from '../services/paymentService';
import TaxFormService from '../services/taxFormService';

const Payment = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, token } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [expectedReturn, setExpectedReturn] = useState(0);
  const [showRazorpayWebView, setShowRazorpayWebView] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState<any>(null);

  // Get applicationId from route params or fetch from current application
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setLoading(true);
        
        // Get applicationId from route params if provided
        const routeApplicationId = (route.params as any)?.applicationId;
        
        // Fetch tax forms to get payment details
        const taxForms = await TaxFormService.getTaxFormHistory(token);
        
        console.log('📋 Tax forms fetched:', taxForms?.length || 0, 'forms');
        console.log('📋 All tax forms data:', JSON.stringify(taxForms, null, 2));
        
        // Log each form's paymentAmount specifically
        if (taxForms && taxForms.length > 0) {
          taxForms.forEach((form: any, index: number) => {
            console.log(`📋 Form ${index + 1}:`, {
              id: form.id,
              taxYear: form.taxYear,
              paymentAmount: form.paymentAmount,
              paymentAmountType: typeof form.paymentAmount,
              expectedReturn: form.expectedReturn,
              status: form.status
            });
          });
        }
        
        if (!taxForms || taxForms.length === 0) {
          console.log('❌ No tax forms found');
          setLoading(false);
          return;
        }

        const currentYear = new Date().getFullYear();
        let targetForm = null;

        if (routeApplicationId) {
          console.log('🔍 Looking for form with ID:', routeApplicationId);
          // Find the specific form by ID
          targetForm = taxForms.find((form: any) => 
            form.id === routeApplicationId && form.taxYear === currentYear
          );
          if (!targetForm) {
            // If not found for current year, try any year
            console.log('🔍 Not found for current year, trying any year...');
            targetForm = taxForms.find((form: any) => form.id === routeApplicationId);
          }
        } else {
          console.log('🔍 Looking for current year form:', currentYear);
          // Find current year form
          targetForm = taxForms.find((form: any) => form.taxYear === currentYear);
        }

        if (targetForm) {
          console.log('✅ Found tax form:', {
            id: targetForm.id,
            taxYear: targetForm.taxYear,
            paymentAmount: targetForm.paymentAmount,
            paymentAmountType: typeof targetForm.paymentAmount,
            expectedReturn: targetForm.expectedReturn,
            status: targetForm.status
          });
          
          // Convert paymentAmount to number if it's a string
          const paymentAmt = typeof targetForm.paymentAmount === 'string' 
            ? parseFloat(targetForm.paymentAmount) 
            : (targetForm.paymentAmount || 0);
          
          const expectedRet = typeof targetForm.expectedReturn === 'string'
            ? parseFloat(targetForm.expectedReturn)
            : (targetForm.expectedReturn || 0);
          
          console.log('💰 Setting payment values:', {
            paymentAmount: paymentAmt,
            expectedReturn: expectedRet
          });
          
          setApplicationId(targetForm.id);
          setPaymentAmount(paymentAmt);
          setExpectedReturn(expectedRet);
        } else {
          console.log('❌ Tax form not found');
          console.log('Available forms:', taxForms.map((f: any) => ({ id: f.id, taxYear: f.taxYear, paymentAmount: f.paymentAmount })));
          Alert.alert('Error', 'Application not found. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching payment details:', error);
        Alert.alert('Error', 'Failed to load payment details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPaymentDetails();
    }
  }, [token, route.params]);

  const handlePayment = async () => {
    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the terms and conditions before proceeding.');
      return;
    }

    if (!applicationId) {
      Alert.alert('Error', 'Application ID not found. Please try again.');
      return;
    }

    if (!paymentAmount || paymentAmount <= 0) {
      Alert.alert('Error', 'Invalid payment amount. Please contact support.');
      return;
    }

    try {
      setIsProcessing(true);

      // Create Razorpay order
      const orderResponse = await PaymentService.createOrder(applicationId, paymentAmount, token);
      
      if (!orderResponse.success || !orderResponse.order) {
        throw new Error(orderResponse.error || 'Failed to create payment order');
      }

      const { order } = orderResponse;

      // Validate order data
      if (!order.key_id || !order.id || !order.amount) {
        Alert.alert('Error', 'Invalid payment order data. Please try again.');
        return;
      }

      // Set order data and open WebView
      setRazorpayOrderData({
        keyId: order.key_id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency || 'USD',
        receipt: order.receipt
      });
      setShowRazorpayWebView(true);
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Failed',
        error.message || 'An error occurred during payment. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment success detected from URL (fallback when handler doesn't fire)
  const handlePaymentSuccessFromURL = async (paymentId: string, orderId: string) => {
    console.log('🔍 Handling payment success from URL');
    console.log('📦 Payment ID:', paymentId);
    console.log('📦 Order ID:', orderId);
    
    if (!applicationId || !paymentId || !orderId) {
      console.error('❌ Missing required payment data');
      Alert.alert('Error', 'Invalid payment data. Please contact support.');
      return;
    }

    // Show processing state
    setIsProcessing(true);
    setRazorpayOrderData(null);

    try {
      console.log('🔐 Verifying payment via URL detection...');
      // Call backend to verify payment using payment_id and order_id
      // Backend will fetch payment details from Razorpay and verify
      const verifyResponse = await PaymentService.verifyPaymentByUrl(
        applicationId,
        orderId,
        paymentId,
        token
      );

      console.log('🔐 Verification response:', verifyResponse);

      if (verifyResponse.success) {
        Alert.alert(
          'Payment Successful!',
          `Your payment of $${paymentAmount.toFixed(2)} has been processed successfully.`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('Home');
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        throw new Error(verifyResponse.error || 'Payment verification failed');
      }
    } catch (verifyError: any) {
      console.error('❌ Payment verification error:', verifyError);
      Alert.alert(
        'Verification Failed',
        verifyError.message || 'Payment verification failed. Please contact support.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Home');
            }
          }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMessage = async (event: any) => {
    try {
      console.log('📨 Received message from WebView:', event.nativeEvent.data);
      
      const messageData = event.nativeEvent.data;
      if (!messageData) {
        console.log('⚠️ Empty message received');
        return;
      }

      const message = JSON.parse(messageData);
      console.log('📨 Parsed message:', message);

      if (message.type === 'payment_success') {
        console.log('✅ Payment success message received');
        
        // Close WebView immediately
        setShowRazorpayWebView(false);
        setRazorpayOrderData(null);
        
        const {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        } = message.data;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          console.error('❌ Missing payment data:', message.data);
          Alert.alert('Error', 'Invalid payment data received. Please contact support.');
          return;
        }

        // Show processing state
        setIsProcessing(true);

        // Verify payment on backend
        try {
          console.log('🔐 Verifying payment on backend...');
          const verifyResponse = await PaymentService.verifyPayment(
            applicationId!,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            token
          );

          console.log('🔐 Verification response:', verifyResponse);

          if (verifyResponse.success) {
            // Show success and navigate
            Alert.alert(
              'Payment Successful!',
              `Your payment of $${paymentAmount.toFixed(2)} has been processed successfully.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate back to home
                    navigation.navigate('Home');
                  }
                }
              ],
              { cancelable: false }
            );
          } else {
            throw new Error(verifyResponse.error || 'Payment verification failed');
          }
        } catch (verifyError: any) {
          console.error('❌ Payment verification error:', verifyError);
          Alert.alert(
            'Verification Failed',
            verifyError.message || 'Payment verification failed. Please contact support.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Still navigate home, user can check payment status
                  navigation.navigate('Home');
                }
              }
            ]
          );
        } finally {
          setIsProcessing(false);
        }
      } else if (message.type === 'payment_cancelled') {
        console.log('❌ Payment cancelled by user');
        setShowRazorpayWebView(false);
        setRazorpayOrderData(null);
        setIsProcessing(false);
      } else if (message.type === 'payment_failed') {
        console.log('❌ Payment failed:', message.data);
        setShowRazorpayWebView(false);
        setRazorpayOrderData(null);
        setIsProcessing(false);
        Alert.alert(
          'Payment Failed',
          'Your payment could not be processed. Please try again or contact support.',
          [{ text: 'OK' }]
        );
      } else if (message.type === 'payment_success_detected') {
        // Fallback: Payment success detected but handler didn't fire
        console.log('⚠️ Payment success detected but handler may not have fired');
        // Don't close WebView here - wait for actual handler
        // This is just for debugging
      } else if (message.type === 'error') {
        console.error('❌ JavaScript error in WebView:', message.message);
      } else {
        console.log('⚠️ Unknown message type:', message.type);
      }
    } catch (error: any) {
      console.error('❌ Error processing payment message:', error);
      console.error('❌ Raw message data:', event.nativeEvent.data);
      // Close WebView on error
      setShowRazorpayWebView(false);
      setRazorpayOrderData(null);
      setIsProcessing(false);
      Alert.alert(
        'Error',
        'An error occurred while processing payment. Please try again or contact support.'
      );
    }
  };

  // Razorpay WebView HTML
  const razorpayHTML = razorpayOrderData ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #f5f5f5;
        }
        .container {
          text-align: center;
        }
        .loading {
          color: #666;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="loading">Loading payment gateway...</div>
      </div>
      <script>
        console.log('Initializing Razorpay checkout...');
        
        var options = {
          "key": "${razorpayOrderData.keyId}",
          "amount": ${razorpayOrderData.amount},
          "currency": "${razorpayOrderData.currency}",
          "order_id": "${razorpayOrderData.orderId}",
          "name": "The GrowWell Tax",
          "description": "Tax Filing Service - ${new Date().getFullYear()}",
          "handler": function (response) {
            console.log('Payment success handler called:', response);
            try {
              var message = {
                type: 'payment_success',
                data: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                }
              };
              console.log('Sending message to React Native:', message);
              window.ReactNativeWebView.postMessage(JSON.stringify(message));
              console.log('Message sent successfully');
            } catch (error) {
              console.error('Error sending message:', error);
            }
          },
          "prefill": {
            "email": "${user?.email || ''}",
            "contact": "${user?.phone || ''}",
            "name": "${user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split('@')[0] || 'User'}"
          },
          "theme": {
            "color": "#007bff"
          },
          "modal": {
            "ondismiss": function() {
              console.log('Payment modal dismissed');
              try {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'payment_cancelled'
                }));
              } catch (error) {
                console.error('Error sending cancel message:', error);
              }
            }
          }
        };
        
        var rzp = new Razorpay(options);
        
        rzp.on('payment.failed', function (response) {
          console.error('Payment failed:', response);
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'payment_failed',
              data: response
            }));
          } catch (error) {
            console.error('Error sending failure message:', error);
          }
        });
        
        console.log('Opening Razorpay checkout...');
        rzp.open();
      </script>
    </body>
    </html>
  ` : '';

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Button 
            variant="ghost" 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#007bff" />
          </Button>
          <Text style={styles.headerTitle}>Payment</Text>
        </View>

        {/* Payment Summary */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              <FontAwesome name="credit-card" size={24} color="#007bff" />
              <Text style={styles.cardTitleText}>Payment Summary</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Fee:</Text>
              <Text style={styles.summaryValue}>${paymentAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>${paymentAmount.toFixed(2)}</Text>
            </View>
            
            {expectedReturn > 0 && (
              <View style={styles.refundInfo}>
                <Ionicons name="information-circle-outline" size={20} color="#28a745" />
                <Text style={styles.refundText}>
                  Estimated refund: <Text style={styles.refundAmount}>${expectedReturn.toFixed(2)}</Text>
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card style={styles.card}>
          <CardContent>
            <View style={styles.paymentInfo}>
              <Ionicons name="lock-closed" size={24} color="#28a745" />
              <Text style={styles.paymentInfoText}>
                Your payment is processed securely through Razorpay. We do not store your card details.
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <Card style={styles.card}>
          <CardContent>
            <View style={styles.termsRow}>
              <Checkbox
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
              />
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.linkText}>Terms and Conditions</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Pay Button */}
        <Button
          style={[styles.payButton, isProcessing && styles.processingButton]}
          onPress={handlePayment}
          disabled={isProcessing || !agreedToTerms || paymentAmount <= 0}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.payButtonText}>Processing...</Text>
            </>
          ) : (
            <>
              <FontAwesome name="lock" size={20} color="#fff" />
              <Text style={styles.payButtonText}>Pay ${paymentAmount.toFixed(2)}</Text>
            </>
          )}
        </Button>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#28a745" />
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure
          </Text>
        </View>
      </ScrollView>

      {/* Razorpay WebView Modal */}
      <Modal
        visible={showRazorpayWebView}
        animationType="slide"
        onRequestClose={() => {
          setShowRazorpayWebView(false);
          setRazorpayOrderData(null);
        }}
      >
        <SafeAreaWrapper>
          {/* Header with close button */}
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowRazorpayWebView(false);
                setRazorpayOrderData(null);
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.webViewHeaderTitle}>Payment</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* WebView */}
          {razorpayOrderData && (
            <WebView
              source={{ html: razorpayHTML }}
              onMessage={handlePaymentMessage}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                setShowRazorpayWebView(false);
                setRazorpayOrderData(null);
                Alert.alert('Error', 'An error occurred while loading the payment gateway. Please try again.');
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView HTTP error:', nativeEvent);
              }}
              onNavigationStateChange={(navState) => {
                // Log navigation changes for debugging
                console.log('WebView navigation:', navState.url);
                
                // Detect payment success from callback URL
                const url = navState.url;
                if (url && url.includes('api.razorpay.com') && url.includes('/callback/')) {
                  console.log('🔍 Detected Razorpay callback URL');
                  
                  // Check if payment was successful
                  if (url.includes('status=authorized') || url.includes('status=captured')) {
                    console.log('✅ Payment success detected from URL');
                    
                    // Extract payment_id from URL
                    // URL pattern: https://api.razorpay.com/v1/payments/pay_XXXXX/callback/...
                    const paymentIdMatch = url.match(/\/payments\/(pay_[^\/]+)\//);
                    const paymentId = paymentIdMatch ? paymentIdMatch[1] : null;
                    
                    if (paymentId && razorpayOrderData) {
                      console.log('📦 Extracted payment ID:', paymentId);
                      console.log('📦 Order ID:', razorpayOrderData.orderId);
                      
                      // Close WebView immediately
                      setShowRazorpayWebView(false);
                      
                      // Since we don't have the signature from URL, we need to verify via backend
                      // The backend will fetch payment details from Razorpay and verify
                      handlePaymentSuccessFromURL(paymentId, razorpayOrderData.orderId);
                    }
                  } else if (url.includes('status=failed') || url.includes('status=error')) {
                    console.log('❌ Payment failure detected from URL');
                    setShowRazorpayWebView(false);
                    setRazorpayOrderData(null);
                    Alert.alert(
                      'Payment Failed',
                      'Your payment could not be processed. Please try again.',
                      [{ text: 'OK' }]
                    );
                  }
                }
              }}
              injectedJavaScript={`
                // Add a listener to catch any errors
                window.addEventListener('error', function(e) {
                  console.error('WebView JavaScript error:', e.message);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    message: e.message
                  }));
                });
                
                // Monitor for Razorpay success page
                setInterval(function() {
                  if (document.body && document.body.innerText) {
                    var bodyText = document.body.innerText.toLowerCase();
                    if (bodyText.includes('payment successful') || bodyText.includes('payment is successful')) {
                      console.log('Detected payment success page');
                      // Try to extract payment details from page
                      var paymentId = '';
                      var orderId = '';
                      var signature = '';
                      
                      // Look for payment details in the page
                      var scripts = document.getElementsByTagName('script');
                      for (var i = 0; i < scripts.length; i++) {
                        var scriptText = scripts[i].innerText || scripts[i].textContent || '';
                        if (scriptText.includes('razorpay_payment_id')) {
                          try {
                            var match = scriptText.match(/razorpay_payment_id['"]?\\s*[:=]\\s*['"]([^'"]+)['"]/);
                            if (match) paymentId = match[1];
                          } catch(e) {}
                        }
                      }
                      
                      // If we detect success but no message was sent, send a fallback message
                      if (paymentId) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'payment_success_detected',
                          detected: true
                        }));
                      }
                    }
                  }
                }, 2000);
                
                true; // Required for injected JavaScript
              `}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#007bff" />
                  <Text style={styles.webViewLoadingText}>Loading payment gateway...</Text>
                </View>
              )}
            />
          )}
        </SafeAreaWrapper>
      </Modal>
      
      {/* Processing Overlay - Shows after payment success while verifying */}
      {isProcessing && !showRazorpayWebView && (
        <Modal
          visible={isProcessing && !showRazorpayWebView}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.processingOverlay}>
            <View style={styles.processingContent}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.processingText}>Verifying payment...</Text>
              <Text style={styles.processingSubtext}>Please wait</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: BackgroundColors.primary,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BackgroundColors.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  refundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#d4edda',
    borderRadius: 8,
    gap: 8,
  },
  refundText: {
    fontSize: 14,
    color: '#155724',
    flex: 1,
  },
  refundAmount: {
    fontWeight: 'bold',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#004085',
    flex: 1,
    lineHeight: 20,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  linkText: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  payButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    gap: 8,
  },
  processingButton: {
    backgroundColor: '#6c757d',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  webViewHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  webViewLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  processingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default Payment;
