import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import PersonalInfoManagement from './PersonalInfoManagement';
import { PersonalInfoManagementProps } from './types';

interface PersonalInfoModalProps extends PersonalInfoManagementProps {
  visible: boolean;
  onClose: () => void;
}

const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({
  visible,
  onClose,
  ...personalInfoProps
}) => {
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
            <Text style={styles.title}>Personal Information</Text>
          </View>

          <View style={styles.content}>
            <PersonalInfoManagement {...personalInfoProps} />
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
  },
});

export default PersonalInfoModal;
