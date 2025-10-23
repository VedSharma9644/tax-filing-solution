import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';

interface SectionSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSection: (section: 'additional-income' | 'dependents' | 'personal-info') => void;
}

const SectionSelectionModal: React.FC<SectionSelectionModalProps> = ({
  visible,
  onClose,
  onSelectSection
}) => {
  const sections = [
    {
      id: 'additional-income' as const,
      title: 'Additional Income',
      description: 'Manage additional income sources',
      icon: 'cash-outline',
      color: '#007bff'
    },
    {
      id: 'dependents' as const,
      title: 'Dependents',
      description: 'Manage dependent information',
      icon: 'people-outline',
      color: '#28a745'
    },
    {
      id: 'personal-info' as const,
      title: 'Personal Information',
      description: 'Manage personal details',
      icon: 'person-outline',
      color: '#6c757d'
    }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaWrapper>
        <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Select Section</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>Choose what you'd like to manage:</Text>
          
          {sections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={styles.sectionCard}
              onPress={() => onSelectSection(section.id)}
            >
              <View style={styles.sectionContent}>
                <View style={[styles.iconContainer, { backgroundColor: section.color }]}>
                  <Ionicons name={section.icon} size={24} color="#ffffff" />
                </View>
                <View style={styles.sectionText}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionDescription}>{section.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
        </View>
      </SafeAreaWrapper>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sectionText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default SectionSelectionModal;
