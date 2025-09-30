import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

interface AdditionalIncomeSource {
  id: string;
  source: string;
  amount: string;
  description?: string;
  documents?: any[]; // For future document upload functionality
}

interface Step2AdditionalIncomeProps {
  formData: {
    hasAdditionalIncome: boolean;
    additionalIncomeSources: AdditionalIncomeSource[];
  };
  onUpdateFormData: (field: string, value: any) => void;
}

const Step2AdditionalIncome: React.FC<Step2AdditionalIncomeProps> = ({
  formData,
  onUpdateFormData,
}) => {
  const [newIncomeSource, setNewIncomeSource] = useState('');
  const [newIncomeAmount, setNewIncomeAmount] = useState('');
  const [newIncomeDescription, setNewIncomeDescription] = useState('');
  const [selectedSourceType, setSelectedSourceType] = useState('');

  // Common income sources
  const commonIncomeSources = [
    'Investment Income (Stocks, Bonds)',
    'Rental Income',
    'Freelance/Self-Employment',
    'Interest Income (Savings, CDs)',
    'Dividend Income',
    'Capital Gains (Property Sale)',
    'Business Income',
    'Royalty Income',
    'Pension/Annuity Income',
    'Unemployment Benefits',
    'Social Security Benefits',
    'Other'
  ];

  const handleHasAdditionalIncomeChange = (hasIncome: boolean) => {
    onUpdateFormData('hasAdditionalIncome', hasIncome);
    if (!hasIncome) {
      onUpdateFormData('additionalIncomeSources', []);
    }
  };

  const addIncomeSource = () => {
    if (!newIncomeSource.trim() || !newIncomeAmount.trim()) {
      Alert.alert('Error', 'Please fill in both income source and amount.');
      return;
    }

    const amount = parseFloat(newIncomeAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    const newSource: AdditionalIncomeSource = {
      id: Date.now().toString(),
      source: newIncomeSource.trim(),
      amount: newIncomeAmount.trim(),
      description: newIncomeDescription.trim() || undefined,
      documents: []
    };

    const currentSources = formData.additionalIncomeSources || [];
    const updatedSources = [...currentSources, newSource];
    onUpdateFormData('additionalIncomeSources', updatedSources);

    // Reset form
    setNewIncomeSource('');
    setNewIncomeAmount('');
    setNewIncomeDescription('');
    setSelectedSourceType('');
  };

  const removeIncomeSource = (id: string) => {
    const sources = formData.additionalIncomeSources || [];
    const updatedSources = sources.filter(source => source.id !== id);
    onUpdateFormData('additionalIncomeSources', updatedSources);
  };

  const updateIncomeSource = (id: string, field: keyof AdditionalIncomeSource, value: string) => {
    const sources = formData.additionalIncomeSources || [];
    const updatedSources = sources.map(source =>
      source.id === id ? { ...source, [field]: value } : source
    );
    onUpdateFormData('additionalIncomeSources', updatedSources);
  };

  const handleSourceTypeSelect = (sourceType: string) => {
    setSelectedSourceType(sourceType);
    if (sourceType === 'Other') {
      setNewIncomeSource('');
    } else {
      setNewIncomeSource(sourceType);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '$0.00' : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTotalAdditionalIncome = () => {
    const sources = formData.additionalIncomeSources || [];
    return sources.reduce((total, source) => {
      const amount = parseFloat(source.amount) || 0;
      return total + amount;
    }, 0);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.card}>
        <CardHeader>
          <CardDescription style={styles.description}>
          Any other income sources besides W-2 wages, such as investments, rental, or freelance work?
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Has Additional Income Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>Do you have any additional income sources?</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  formData.hasAdditionalIncome === true && styles.yesNoButtonSelected
                ]}
                onPress={() => handleHasAdditionalIncomeChange(true)}
              >
                <Text style={[
                  styles.yesNoButtonText,
                  formData.hasAdditionalIncome === true && styles.yesNoButtonTextSelected
                ]}>
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  formData.hasAdditionalIncome === false && styles.yesNoButtonSelected
                ]}
                onPress={() => handleHasAdditionalIncomeChange(false)}
              >
                <Text style={[
                  styles.yesNoButtonText,
                  formData.hasAdditionalIncome === false && styles.yesNoButtonTextSelected
                ]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Income Sources */}
          {formData.hasAdditionalIncome && (
            <View style={styles.sourcesContainer}>
              <Text style={styles.sectionTitle}>Your Additional Income Sources</Text>
              
              {/* Existing Sources */}
              {(formData.additionalIncomeSources || []).map((source, index) => (
                <Card key={source.id} style={styles.sourceCard}>
                  <CardContent style={styles.sourceContent}>
                    <View style={styles.sourceHeader}>
                      <Text style={styles.sourceNumber}>#{index + 1}</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeIncomeSource(source.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#dc3545" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.sourceField}>
                      <Text style={styles.fieldLabel}>Income Source</Text>
                      <TextInput
                        style={styles.textInput}
                        value={source.source}
                        onChangeText={(value) => updateIncomeSource(source.id, 'source', value)}
                        placeholder="e.g., Rental Income"
                      />
                    </View>
                    
                    <View style={styles.sourceField}>
                      <Text style={styles.fieldLabel}>Amount Earned</Text>
                      <TextInput
                        style={styles.textInput}
                        value={source.amount}
                        onChangeText={(value) => updateIncomeSource(source.id, 'amount', value)}
                        placeholder="0.00"
                        keyboardType="numeric"
                      />
                    </View>
                    
                    <View style={styles.sourceField}>
                      <Text style={styles.fieldLabel}>Description (Optional)</Text>
                      <TextInput
                        style={[styles.textInput, styles.textArea]}
                        value={source.description || ''}
                        onChangeText={(value) => updateIncomeSource(source.id, 'description', value)}
                        placeholder="Additional details about this income source"
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  </CardContent>
                </Card>
              ))}

              {/* Add New Source Form */}
              <Card style={styles.addSourceCard}>
                <CardHeader>
                  <CardTitle style={styles.addSourceTitle}>Add New Income Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <View style={styles.addSourceForm}>
                    <View style={styles.sourceField}>
                      <Text style={styles.fieldLabel}>Select Income Type</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={selectedSourceType}
                          onValueChange={handleSourceTypeSelect}
                          style={styles.picker}
                          itemStyle={styles.pickerItem}
                        >
                          <Picker.Item label="Choose a common income type" value="" />
                          {commonIncomeSources.map((source) => (
                            <Picker.Item key={source} label={source} value={source} />
                          ))}
                        </Picker>
                      </View>
                    </View>

                    <View style={styles.sourceField}>
                      <Text style={styles.fieldLabel}>Income Source</Text>
                      <TextInput
                        style={styles.textInput}
                        value={newIncomeSource}
                        onChangeText={setNewIncomeSource}
                        placeholder="Enter income source"
                      />
                    </View>

                    <View style={styles.sourceField}>
                      <Text style={styles.fieldLabel}>Amount Earned</Text>
                      <TextInput
                        style={styles.textInput}
                        value={newIncomeAmount}
                        onChangeText={setNewIncomeAmount}
                        placeholder="0.00"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.sourceField}>
                      <Text style={styles.fieldLabel}>Description (Optional)</Text>
                      <TextInput
                        style={[styles.textInput, styles.textArea]}
                        value={newIncomeDescription}
                        onChangeText={setNewIncomeDescription}
                        placeholder="Additional details about this income source"
                        multiline
                        numberOfLines={2}
                      />
                    </View>

                    <Button
                      style={styles.addButton}
                      onPress={addIncomeSource}
                    >
                      <Ionicons name="add" size={20} color="white" style={styles.buttonIcon} />
                      <Text style={styles.addButtonText}>Add Income Source</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>

              {/* Total Summary */}
              {(formData.additionalIncomeSources || []).length > 0 && (
                <Card style={styles.sectionCard}>
                  <CardHeader>
                    <View style={styles.sectionHeader}>
                      <View style={[styles.sectionIcon, { backgroundColor: '#28a745' }]}>
                        <FontAwesome name="dollar" size={20} color="#fff" />
                      </View>
                      <View style={styles.sectionInfo}>
                        <CardTitle style={styles.sectionCardTitle}>Additional Income Sources</CardTitle>
                        <CardDescription>
                          {(formData.additionalIncomeSources || []).length} income source{(formData.additionalIncomeSources || []).length !== 1 ? 's' : ''} • 
                          Total: {formatCurrency(getTotalAdditionalIncome().toString())}
                        </CardDescription>
                      </View>
                    </View>
                  </CardHeader>
                  <CardContent>
                    {(formData.additionalIncomeSources || []).map((source, index) => (
                      <View key={source.id} style={styles.incomeSourceItem}>
                        <View style={styles.incomeSourceHeader}>
                          <Text style={styles.incomeSourceNumber}>#{index + 1}</Text>
                          <Text style={styles.incomeSourceAmount}>{formatCurrency((parseFloat(source.amount) || 0).toString())}</Text>
                        </View>
                        <Text style={styles.incomeSourceName}>{source.source}</Text>
                        {source.description && (
                          <Text style={styles.incomeSourceDescription}>{source.description}</Text>
                        )}
                      </View>
                    ))}
                  </CardContent>
                </Card>
              )}
            </View>
          )}
        </CardContent>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  card: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 0,
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 0,
    paddingBottom: 0,
  },
  questionContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  yesNoButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  yesNoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  yesNoButtonTextSelected: {
    color: '#3b82f6',
  },
  sourcesContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  sourceCard: {
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sourceContent: {
    padding: 16,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sourceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  removeButton: {
    padding: 4,
  },
  sourceField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  addSourceCard: {
    marginTop: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addSourceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  addSourceForm: {
    gap: 16,
  },
  pickerContainer: {
    minHeight: 48,
    paddingTop: 0,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    paddingHorizontal: 12,
  },
  pickerItem: {
    paddingTop: 0,
    fontSize: 16,
    height: 48,
    lineHeight: 48,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionCard: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionCardTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  incomeSourceItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  incomeSourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  incomeSourceNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  incomeSourceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  incomeSourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  incomeSourceDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default Step2AdditionalIncome;
