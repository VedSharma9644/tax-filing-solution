import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionSelectorProps } from './types';

const SectionSelector: React.FC<SectionSelectorProps> = ({
  activeSection,
  onSectionChange
}) => {
  const sections = [
    {
      id: 'additional-income' as const,
      title: 'Additional Income',
      icon: 'cash-outline',
      description: 'Manage additional income sources'
    },
    {
      id: 'dependents' as const,
      title: 'Dependents',
      icon: 'people-outline',
      description: 'Manage dependent information'
    },
    {
      id: 'personal-info' as const,
      title: 'Personal Information',
      icon: 'person-outline',
      description: 'Manage personal details'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Application Information</Text>
      <Text style={styles.subtitle}>Select a section to review and edit</Text>
      
      <View style={styles.sectionsContainer}>
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          
          return (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.sectionCard,
                isActive && styles.activeSectionCard
              ]}
              onPress={() => onSectionChange(section.id)}
            >
              <View style={styles.sectionHeader}>
                <View style={[
                  styles.iconContainer,
                  isActive && styles.activeIconContainer
                ]}>
                  <Ionicons
                    name={section.icon as any}
                    size={24}
                    color={isActive ? '#fff' : '#007bff'}
                  />
                </View>
                <View style={styles.sectionInfo}>
                  <Text style={[
                    styles.sectionTitle,
                    isActive && styles.activeSectionTitle
                  ]}>
                    {section.title}
                  </Text>
                  <Text style={[
                    styles.sectionDescription,
                    isActive && styles.activeSectionDescription
                  ]}>
                    {section.description}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isActive ? '#fff' : '#666'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  sectionsContainer: {
    gap: 12,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activeSectionCard: {
    backgroundColor: '#007bff',
    borderColor: '#0056b3',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activeSectionTitle: {
    color: '#fff',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  activeSectionDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default SectionSelector;
