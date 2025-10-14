import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import AppointmentService from '../services/appointmentService';
import { BackgroundColors, BrandColors, TextColors } from '../utils/colors';

const AppointmentScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const appointmentTypes = [
    { id: 'consultation', name: 'Tax Consultation', icon: 'chatbubble-outline', duration: '30 min' },
    { id: 'review', name: 'Document Review', icon: 'document-outline', duration: '45 min' },
    { id: 'filing', name: 'Tax Filing Help', icon: 'calculator-outline', duration: '60 min' },
    { id: 'planning', name: 'Tax Planning', icon: 'trending-up-outline', duration: '45 min' },
  ];

  // Generate available dates (next 14 days)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const availableDates = generateAvailableDates();

  // Load appointment history on component mount
  useEffect(() => {
    loadAppointmentHistory();
  }, []);

  // Load available time slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      loadAvailableTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadAppointmentHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await AppointmentService.getAppointmentHistory();
      if (response.success) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error loading appointment history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadAvailableTimeSlots = async (date) => {
    try {
      setLoadingSlots(true);
      const response = await AppointmentService.getAvailableTimeSlots(date);
      if (response.success) {
        setAvailableTimeSlots(response.data.availableSlots);
      }
    } catch (error) {
      console.error('Error loading available time slots:', error);
      setAvailableTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date for your appointment.');
      return;
    }

    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time for your appointment.');
      return;
    }

    if (!selectedType) {
      Alert.alert('Error', 'Please select an appointment type.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await AppointmentService.submitAppointment({
        appointmentType: selectedType,
        date: selectedDate,
        time: selectedTime,
        notes: notes.trim()
      });

      if (response.success) {
        Alert.alert(
          'Appointment Scheduled!',
          'Your appointment has been scheduled successfully. You will receive a confirmation email shortly.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setSelectedDate('');
                setSelectedTime('');
                setSelectedType('');
                setNotes('');
                setAvailableTimeSlots([]);
                // Reload history
                loadAppointmentHistory();
                navigation.goBack();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Appointment submission error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to schedule appointment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
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
          <Text style={styles.headerTitle}>Schedule Appointment</Text>
        </View>

        {/* Appointment Form Title */}
        <View style={styles.sectionTitle}>
          <Ionicons name="calendar" size={24} color="#D7B04C" />
          <Text style={styles.sectionTitleText}>Book Your Session</Text>
        </View>

        {/* Appointment Form */}
        <Card style={styles.card}>
          <CardContent>
            {/* Appointment Type */}
            <View style={styles.section}>
              <Text style={styles.label}>Appointment Type</Text>
              <View style={styles.typesContainer}>
                {appointmentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                      selectedType === type.id && styles.typeButtonActive
                    ]}
                    onPress={() => setSelectedType(type.id)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={20}
                      color={selectedType === type.id ? '#fff' : '#007bff'}
                    />
                    <Text style={[
                      styles.typeText,
                      selectedType === type.id && styles.typeTextActive
                    ]}>
                      {type.name}
                    </Text>
                    <Text style={[
                      styles.typeDuration,
                      selectedType === type.id && styles.typeDurationActive
                    ]}>
                      {type.duration}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Select Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesContainer}>
                {availableDates.map((date) => (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.dateButton,
                      selectedDate === date && styles.dateButtonActive
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[
                      styles.dateText,
                      selectedDate === date && styles.dateTextActive
                    ]}>
                      {formatDate(date)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Select Time</Text>
              {loadingSlots ? (
                <Text style={styles.loadingText}>Loading available time slots...</Text>
              ) : availableTimeSlots.length === 0 ? (
                <Text style={styles.noSlotsText}>No available time slots for this date.</Text>
              ) : (
                <View style={styles.timesContainer}>
                  {availableTimeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeButton,
                        selectedTime === time && styles.timeButtonActive
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text style={[
                        styles.timeText,
                        selectedTime === time && styles.timeTextActive
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Any specific topics you'd like to discuss..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <Button 
              style={styles.submitButton} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Scheduling...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Schedule Appointment</Text>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Appointments Title */}
        <View style={styles.sectionTitle}>
          <Ionicons name="time-outline" size={24} color="#D7B04C" />
          <Text style={styles.sectionTitleText}>Upcoming Appointments</Text>
        </View>

        {/* Upcoming Appointments */}
        <Card style={styles.card}>
          <CardContent>
            {loadingHistory ? (
              <Text style={styles.loadingText}>Loading appointments...</Text>
            ) : appointments.length === 0 ? (
              <Text style={styles.noAppointmentsText}>No appointments found.</Text>
            ) : (
              appointments.map((appointment, index) => (
                <View key={appointment.id || index} style={styles.appointmentItem}>
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentType}>
                        {appointmentTypes.find(type => type.id === appointment.appointmentType)?.name || appointment.appointmentType}
                      </Text>
                      <Text style={styles.appointmentDate}>
                        {formatDate(appointment.date)} • {appointment.time}
                      </Text>
                      {appointment.notes && (
                        <Text style={styles.appointmentNotes}>{appointment.notes}</Text>
                      )}
                    </View>
                    <View style={[
                      styles.appointmentStatus,
                      appointment.status === 'scheduled' && styles.statusScheduled,
                      appointment.status === 'confirmed' && styles.statusConfirmed,
                      appointment.status === 'completed' && styles.statusCompleted,
                      appointment.status === 'cancelled' && styles.statusCancelled
                    ]}>
                      <Text style={[
                        styles.statusText,
                        appointment.status === 'scheduled' && styles.statusTextScheduled,
                        appointment.status === 'confirmed' && styles.statusTextConfirmed,
                        appointment.status === 'completed' && styles.statusTextCompleted,
                        appointment.status === 'cancelled' && styles.statusTextCancelled
                      ]}>
                        {appointment.status === 'scheduled' ? 'Scheduled' :
                         appointment.status === 'confirmed' ? 'Confirmed' :
                         appointment.status === 'completed' ? 'Completed' :
                         appointment.status === 'cancelled' ? 'Cancelled' : appointment.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </CardContent>
        </Card>
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
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D7B04C',
  },
  sectionDescription: {
    fontSize: 14,
    color: TextColors.secondary,
    marginBottom: 16,
    lineHeight: 20,
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
  cardDescription: {
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  typesContainer: {
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007bff',
    backgroundColor: BackgroundColors.primary,
    gap: 12,
  },
  typeButtonActive: {
    backgroundColor: BrandColors.primary,
  },
  typeText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
    flex: 1,
  },
  typeTextActive: {
    color: '#fff',
  },
  typeDuration: {
    fontSize: 12,
    color: '#666',
  },
  typeDurationActive: {
    color: '#fff',
  },
  datesContainer: {
    marginBottom: 8,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: BackgroundColors.primary,
    marginRight: 8,
  },
  dateButtonActive: {
    backgroundColor: BrandColors.primary,
    borderColor: '#007bff',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dateTextActive: {
    color: '#fff',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: BackgroundColors.primary,
  },
  timeButtonActive: {
    backgroundColor: BrandColors.primary,
    borderColor: '#007bff',
  },
  timeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  timeTextActive: {
    color: '#fff',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: BackgroundColors.primary,
  },
  submitButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  appointmentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  appointmentDate: {
    fontSize: 14,
    color: '#666',
  },
  appointmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#d4edda',
  },
  statusText: {
    fontSize: 12,
    color: '#155724',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noSlotsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noAppointmentsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  appointmentNotes: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusScheduled: {
    backgroundColor: '#d1ecf1',
  },
  statusConfirmed: {
    backgroundColor: '#d4edda',
  },
  statusCompleted: {
    backgroundColor: '#e2e3e5',
  },
  statusCancelled: {
    backgroundColor: '#f8d7da',
  },
  statusTextScheduled: {
    color: '#0c5460',
  },
  statusTextConfirmed: {
    color: '#155724',
  },
  statusTextCompleted: {
    color: '#6c757d',
  },
  statusTextCancelled: {
    color: '#721c24',
  },
});

export default AppointmentScreen; 