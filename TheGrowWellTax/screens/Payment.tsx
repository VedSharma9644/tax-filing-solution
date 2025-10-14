import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BackgroundColors } from '../utils/colors';

const Payment = () => {
  const navigation = useNavigation<any>();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Mock data - in real app, this would come from API
  const paymentDetails = {
    serviceFee: 99.99,
    tax: 8.99,
    total: 108.98,
    description: 'Tax Filing Service - 2023',
    estimatedRefund: 1250.00
  };

  const handlePayment = () => {
    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the terms and conditions before proceeding.');
      return;
    }

    if (paymentMethod === 'card' && (!cardNumber || !expiryDate || !cvv || !cardholderName)) {
      Alert.alert('Error', 'Please fill in all card details.');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Payment Successful!',
        'Your tax filing has been submitted successfully. You will receive a confirmation email shortly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    }, 3000);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

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
              <Text style={styles.summaryValue}>${paymentDetails.serviceFee}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax:</Text>
              <Text style={styles.summaryValue}>${paymentDetails.tax}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${paymentDetails.total}</Text>
            </View>
            
            <View style={styles.refundInfo}>
              <Ionicons name="information-circle-outline" size={20} color="#28a745" />
              <Text style={styles.refundText}>
                Estimated refund: <Text style={styles.refundAmount}>${paymentDetails.estimatedRefund}</Text>
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              <Ionicons name="card-outline" size={24} color="#007bff" />
              <Text style={styles.cardTitleText}>Payment Method</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.paymentMethods}>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                style={[styles.methodButton, paymentMethod === 'card' && styles.selectedMethod]}
                onPress={() => setPaymentMethod('card')}
              >
                <FontAwesome name="credit-card" size={20} color={paymentMethod === 'card' ? '#fff' : '#007bff'} />
                <Text style={[styles.methodText, paymentMethod === 'card' && styles.selectedMethodText]}>
                  Credit/Debit Card
                </Text>
              </Button>
              
              <Button
                variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                style={[styles.methodButton, paymentMethod === 'bank' && styles.selectedMethod]}
                onPress={() => setPaymentMethod('bank')}
              >
                <FontAwesome name="university" size={20} color={paymentMethod === 'bank' ? '#fff' : '#007bff'} />
                <Text style={[styles.methodText, paymentMethod === 'bank' && styles.selectedMethodText]}>
                  Bank Transfer
                </Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* Card Details */}
        {paymentMethod === 'card' && (
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Ionicons name="card" size={24} color="#007bff" />
                <Text style={styles.cardTitleText}>Card Details</Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  keyboardType="numeric"
                  maxLength={19}
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <Input
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                    keyboardType="numeric"
                    maxLength={5}
                    style={styles.input}
                  />
                </View>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <Input
                    placeholder="123"
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <Input
                  placeholder="John Doe"
                  value={cardholderName}
                  onChangeText={setCardholderName}
                  style={styles.input}
                />
              </View>
            </CardContent>
          </Card>
        )}

        {/* Bank Transfer Info */}
        {paymentMethod === 'bank' && (
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <FontAwesome name="university" size={24} color="#007bff" />
                <Text style={styles.cardTitleText}>Bank Transfer Details</Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.bankInfo}>
                Please transfer ${paymentDetails.total} to the following account:
              </Text>
              <View style={styles.bankDetails}>
                <Text style={styles.bankDetail}>Bank: TaxFiling Bank</Text>
                <Text style={styles.bankDetail}>Account: 1234567890</Text>
                <Text style={styles.bankDetail}>Routing: 987654321</Text>
                <Text style={styles.bankDetail}>Reference: TAX-2023-001</Text>
              </View>
            </CardContent>
          </Card>
        )}

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
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Ionicons name="refresh" size={20} color="#fff" style={styles.spinning} />
              <Text style={styles.payButtonText}>Processing...</Text>
            </>
          ) : (
            <>
              <FontAwesome name="lock" size={20} color="#fff" />
              <Text style={styles.payButtonText}>Pay ${paymentDetails.total}</Text>
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
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: BackgroundColors.primary,
    paddingHorizontal: 16,
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
  },
  refundAmount: {
    fontWeight: 'bold',
  },
  paymentMethods: {
    gap: 12,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  selectedMethod: {
    backgroundColor: '#007bff',
  },
  methodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
  },
  selectedMethodText: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  bankInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  bankDetails: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  bankDetail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
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
  spinning: {
    transform: [{ rotate: '360deg' }],
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
});

export default Payment; 