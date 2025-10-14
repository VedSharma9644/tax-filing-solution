import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  style?: any;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = "Select Date", style }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateSelectable = (year: number, month: number, day: number) => {
    const selectedDate = new Date(year, month, day);
    const today = new Date();
    return selectedDate <= today;
  };

  const formatDate = (year: number, month: number, day: number) => {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${monthStr}/${dayStr}/${year}`;
  };

  const handleDateSelect = (year: number, month: number, day: number) => {
    if (isDateSelectable(year, month, day)) {
      const formattedDate = formatDate(year, month, day);
      onChange(formattedDate);
      setIsVisible(false);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelectable = isDateSelectable(selectedYear, selectedMonth, day);
      const isSelected = value === formatDate(selectedYear, selectedMonth, day);
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelectable && styles.selectableDay,
            isSelected && styles.selectedDay,
            !isSelectable && styles.disabledDay
          ]}
          onPress={() => isSelectable && handleDateSelect(selectedYear, selectedMonth, day)}
          disabled={!isSelectable}
        >
          <Text style={[
            styles.dayText,
            isSelectable && styles.selectableDayText,
            isSelected && styles.selectedDayText,
            !isSelectable && styles.disabledDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;

    if (direction === 'prev') {
      if (selectedMonth === 0) {
        newMonth = 11;
        newYear = selectedYear - 1;
      } else {
        newMonth = selectedMonth - 1;
      }
    } else {
      if (selectedMonth === 11) {
        newMonth = 0;
        newYear = selectedYear + 1;
      } else {
        newMonth = selectedMonth + 1;
      }
    }

    // Don't allow future months
    if (newYear > currentYear || (newYear === currentYear && newMonth > currentMonth)) {
      return;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const changeYear = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' ? selectedYear - 1 : selectedYear + 1;
    
    // Don't allow future years
    if (newYear > currentYear) {
      return;
    }

    setSelectedYear(newYear);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.input, style]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Year Selector */}
            <View style={styles.yearSelector}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => changeYear('prev')}
                disabled={selectedYear <= 1900}
              >
                <Ionicons name="chevron-back" size={20} color={selectedYear <= 1900 ? "#ccc" : "#007bff"} />
              </TouchableOpacity>
              <Text style={styles.yearText}>{selectedYear}</Text>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => changeYear('next')}
                disabled={selectedYear >= currentYear}
              >
                <Ionicons name="chevron-forward" size={20} color={selectedYear >= currentYear ? "#ccc" : "#007bff"} />
              </TouchableOpacity>
            </View>

            {/* Month Selector */}
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => changeMonth('prev')}
                disabled={selectedYear === currentYear && selectedMonth === currentMonth}
              >
                <Ionicons name="chevron-back" size={20} color={selectedYear === currentYear && selectedMonth === currentMonth ? "#ccc" : "#007bff"} />
              </TouchableOpacity>
              <Text style={styles.monthText}>{months[selectedMonth]}</Text>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => changeMonth('next')}
                disabled={selectedYear === currentYear && selectedMonth === currentMonth}
              >
                <Ionicons name="chevron-forward" size={20} color={selectedYear === currentYear && selectedMonth === currentMonth ? "#ccc" : "#007bff"} />
              </TouchableOpacity>
            </View>

            {/* Calendar */}
            <View style={styles.calendar}>
              {/* Day headers */}
              <View style={styles.calendarHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Text key={day} style={styles.dayHeader}>{day}</Text>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={styles.calendarGrid}>
                {renderCalendar()}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  arrowButton: {
    padding: 8,
  },
  yearText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  calendar: {
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectableDay: {
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: '#007bff',
    borderRadius: 20,
  },
  disabledDay: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  selectableDayText: {
    color: '#333',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledDayText: {
    color: '#ccc',
  },
  modalFooter: {
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default DatePicker; 