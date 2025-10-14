import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MilestoneProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onStepPress: (step: number) => void;
  steps: {
    id: number;
    title: string;
    icon: string;
  }[];
}

const MilestoneProgressBar: React.FC<MilestoneProgressBarProps> = ({
  currentStep,
  totalSteps,
  onStepPress,
  steps,
}) => {
  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      return 'completed';
    } else if (stepNumber === currentStep) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  const getStepIcon = (stepNumber: number, icon: string) => {
    const status = getStepStatus(stepNumber);
    
    switch (status) {
      case 'completed':
        return (
          <View style={[styles.iconContainer, styles.completedIcon]}>
            <Ionicons name="checkmark" size={16} color="#ffffff" />
          </View>
        );
      case 'current':
        return (
          <View style={[styles.iconContainer, styles.currentIcon]}>
            <Ionicons name={icon as any} size={16} color="#ffffff" />
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.iconContainer, styles.pendingIcon]}>
            <Ionicons name={icon as any} size={16} color="#9CA3AF" />
          </View>
        );
      default:
        return null;
    }
  };

  const getConnectorColor = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      return '#10B981'; // Green for completed
    } else {
      return '#6B7280'; // Gray for pending
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step */}
            <TouchableOpacity
              style={styles.stepContainer}
              onPress={() => onStepPress(step.id)}
              activeOpacity={0.7}
            >
              {getStepIcon(step.id, step.icon)}
              <Text style={[
                styles.stepText,
                getStepStatus(step.id) === 'current' && styles.currentStepText
              ]}>
                {step.title}
              </Text>
            </TouchableOpacity>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: getConnectorColor(step.id) }
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937', // Dark background like in the image
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  completedIcon: {
    backgroundColor: '#10B981', // Green
  },
  currentIcon: {
    backgroundColor: '#10B981', // Green
  },
  pendingIcon: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6B7280', // Gray
  },
  stepText: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '400',
  },
  currentStepText: {
    fontWeight: '600',
  },
  connector: {
    height: 2,
    flex: 1,
    marginHorizontal: 8,
    marginTop: -20, // Adjust to align with icon center
  },
});

export default MilestoneProgressBar;
