import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BackgroundColors, BrandColors, TextColors } from '../utils/colors';

const PaymentHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const paymentHistory = [
    {
      id: '1',
      date: 'Mar 15, 2024',
      amount: 99.99,
      status: 'completed',
      description: 'Tax Filing Service - 2023',
      paymentMethod: 'Credit Card',
      transactionId: 'pi_3R9yNfG09mwQybGj0ctiHaig',
      refundAmount: 0,
    },
    {
      id: '2',
      date: 'Feb 28, 2024',
      amount: 72.67,
      status: 'completed',
      description: 'Tax Filing Service - 2022',
      paymentMethod: 'Credit Card',
      transactionId: 'pi_3R8HcKG09mwQybGj1dmCCp5F',
      refundAmount: 0,
    },
    {
      id: '3',
      date: 'Feb 15, 2024',
      amount: 41.65,
      status: 'completed',
      description: 'Tax Filing Service - 2021',
      paymentMethod: 'Credit Card',
      transactionId: 'pi_3R7baFG09mwQybGj1Du857Oh',
      refundAmount: 0,
    },
    {
      id: '4',
      date: 'Jan 30, 2024',
      amount: 72.67,
      status: 'refunded',
      description: 'Tax Filing Service - 2020',
      paymentMethod: 'Credit Card',
      transactionId: 'pi_3R4EMyG09mwQybGj1mzYKv7r',
      refundAmount: 72.67,
    },
  ];

  const filters = [
    { id: 'all', name: 'All Payments' },
    { id: 'completed', name: 'Completed' },
    { id: 'refunded', name: 'Refunded' },
  ];

  const filteredPayments = selectedFilter === 'all' 
    ? paymentHistory 
    : paymentHistory.filter(payment => payment.status === selectedFilter);

  const totalSpent = paymentHistory
    .filter(payment => payment.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const totalRefunded = paymentHistory
    .filter(payment => payment.status === 'refunded')
    .reduce((sum, payment) => sum + payment.refundAmount, 0);

  const handleViewReceipt = (payment: any) => {
    Alert.alert(
      'Receipt',
      `Transaction ID: ${payment.transactionId}\nAmount: $${payment.amount}\nDate: ${payment.date}\nStatus: ${payment.status}`,
      [{ text: 'OK' }]
    );
  };

  const handleRequestRefund = (payment: any) => {
    Alert.alert(
      'Request Refund',
      'Your refund request has been submitted. We\'ll process it within 5-7 business days.',
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'refunded':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'refunded':
        return 'Refunded';
      default:
        return 'Pending';
    }
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
            <Ionicons name="arrow-back" size={24} color={TextColors.white} />
          </Button>
          <Text style={styles.headerTitle}>Payment History</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <CardContent>
              <View style={styles.summaryContent}>
                <Ionicons name="card-outline" size={24} color="#007bff" />
                <Text style={styles.summaryLabel}>Total Spent</Text>
                <Text style={styles.summaryValue}>${totalSpent.toFixed(2)}</Text>
              </View>
            </CardContent>
          </Card>

          <Card style={styles.summaryCard}>
            <CardContent>
              <View style={styles.summaryContent}>
                <Ionicons name="refresh-outline" size={24} color="#17a2b8" />
                <Text style={styles.summaryLabel}>Total Refunded</Text>
                <Text style={styles.summaryValue}>${totalRefunded.toFixed(2)}</Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersLabel}>Filter by:</Text>
          <View style={styles.filtersRow}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.id && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextActive
                ]}>
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment History */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              <Ionicons name="time-outline" size={24} color="#007bff" />
              <Text style={styles.cardTitleText}>Payment History</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayments.map((payment) => (
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentDescription}>{payment.description}</Text>
                    <Text style={styles.paymentDate}>{payment.date}</Text>
                    <Text style={styles.paymentMethod}>{payment.paymentMethod}</Text>
                  </View>
                  <View style={styles.paymentAmount}>
                    <Text style={styles.amountText}>${payment.amount}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(payment.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(payment.status) }
                      ]}>
                        {getStatusText(payment.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.paymentActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleViewReceipt(payment)}
                  >
                    <Ionicons name="receipt-outline" size={16} color="#007bff" />
                    <Text style={styles.actionText}>View Receipt</Text>
                  </TouchableOpacity>
                  
                  {payment.status === 'completed' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleRequestRefund(payment)}
                    >
                      <Ionicons name="refresh-outline" size={16} color="#17a2b8" />
                      <Text style={[styles.actionText, { color: '#17a2b8' }]}>Request Refund</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* No Payments Message */}
        {filteredPayments.length === 0 && (
          <Card style={styles.card}>
            <CardContent>
              <View style={styles.emptyState}>
                <Ionicons name="card-outline" size={48} color="#ccc" />
                <Text style={styles.emptyTitle}>No payments found</Text>
                <Text style={styles.emptyText}>
                  {selectedFilter === 'all' 
                    ? 'You haven\'t made any payments yet.'
                    : `No ${selectedFilter} payments found.`
                  }
                </Text>
              </View>
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: BackgroundColors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: BackgroundColors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderRadius: 8,
  },
  backButton: {
    marginRight: 6,
    marginTop: -6,
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TextColors.white,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: BackgroundColors.primary,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: BackgroundColors.primary,
  },
  filterButtonActive: {
    backgroundColor: BrandColors.primary,
    borderColor: '#007bff',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: BackgroundColors.primary,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#999',
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default PaymentHistoryScreen; 