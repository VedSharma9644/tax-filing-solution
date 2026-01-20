import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { BackgroundColors, BrandColors, TextColors } from '../utils/colors';
import { useAuth } from '../contexts/AuthContext';
import {
  getDeletionRequests,
  saveDeletionRequest,
} from '../services/accountDeletionRequestService';

type DeletionReason =
  | 'no_longer_needed'
  | 'privacy_concerns'
  | 'duplicate_account'
  | 'too_expensive'
  | 'other';

const reasons: { id: DeletionReason; label: string; subtitle: string }[] = [
  {
    id: 'no_longer_needed',
    label: 'No longer needed',
    subtitle: 'I finished my filings and no longer need the app',
  },
  {
    id: 'privacy_concerns',
    label: 'Privacy concerns',
    subtitle: 'I want my personal data removed',
  },
  {
    id: 'duplicate_account',
    label: 'Duplicate account',
    subtitle: 'I created another account by mistake',
  },
  {
    id: 'too_expensive',
    label: 'Too expensive',
    subtitle: 'Pricing or billing concerns',
  },
  {
    id: 'other',
    label: 'Other',
    subtitle: 'Different reason (please share details)',
  },
];

const AccountDeletionRequestScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [selectedReason, setSelectedReason] = useState<DeletionReason | null>(
    null
  );
  const [details, setDetails] = useState('');
  const [contact, setContact] = useState(user?.email || '');
  const [confirm, setConfirm] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadExistingRequests();
  }, []);

  const loadExistingRequests = async () => {
    const history = await getDeletionRequests(user?.id);
    setRequests(history);
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select a reason', 'Please choose why you want to delete.');
      return;
    }

    if (!confirm) {
      Alert.alert(
        'Confirm required',
        'Please confirm you understand this will start the deletion process.'
      );
      return;
    }

    if (!contact.trim()) {
      Alert.alert('Contact required', 'Please provide an email or phone.');
      return;
    }

    setIsSubmitting(true);

    try {
      const saved = await saveDeletionRequest(
        {
          reason: selectedReason,
          details: details.trim(),
          contact: contact.trim(),
          acknowledged: confirm,
        },
        user?.id
      );

      setRequests((prev) => [saved, ...prev]);
      setDetails('');
      setConfirm(false);
      Alert.alert(
        'Request received',
        "We've logged your deletion request. A specialist will reach out to confirm and finalize the deletion.",
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Unable to submit',
        'Something went wrong while saving your request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const latestRequest = requests[0];

  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Button
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={TextColors.white} />
          </Button>
          <View>
            <Text style={styles.headerTitle}>Close Account</Text>
            <Text style={styles.headerSubtitle}>
              Register your deletion request in a few steps
            </Text>
          </View>
        </View>

        <Card style={styles.heroCard}>
          <CardContent>
            <View style={styles.heroRow}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons
                  name="shield-lock"
                  size={28}
                  color={BrandColors.primary}
                />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Your request is safe</Text>
                <Text style={styles.heroText}>
                  We’ll review this within 1 business day, verify ownership, and
                  confirm before permanently deleting your data.
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardContent>
            <Text style={styles.sectionLabel}>Reason for deletion</Text>
            <View style={styles.reasonsGrid}>
              {reasons.map((reason) => {
                const isSelected = selectedReason === reason.id;
                return (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reasonChip,
                      isSelected && styles.reasonChipActive,
                    ]}
                    onPress={() => setSelectedReason(reason.id)}
                  >
                    <Text
                      style={[
                        styles.reasonLabel,
                        isSelected && styles.reasonLabelActive,
                      ]}
                    >
                      {reason.label}
                    </Text>
                    <Text style={styles.reasonSubtitle}>{reason.subtitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, styles.spacingTop]}>
              Extra details (optional)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Share context that helps us process this smoothly..."
              placeholderTextColor={TextColors.tertiary}
              multiline
              value={details}
              onChangeText={setDetails}
            />

            <Text style={[styles.sectionLabel, styles.spacingTop]}>
              Preferred contact
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email or phone number for confirmation"
              placeholderTextColor={TextColors.tertiary}
              value={contact}
              onChangeText={setContact}
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setConfirm((prev) => !prev)}
            >
              <View style={[styles.checkbox, confirm && styles.checkboxChecked]}>
                {confirm && (
                  <Ionicons name="checkmark" size={16} color={TextColors.white} />
                )}
              </View>
              <Text style={styles.checkboxText}>
                I understand this starts the process to permanently delete my
                account and data.
              </Text>
            </TouchableOpacity>

            <Button
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit request'}
              </Text>
            </Button>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardContent>
            <Text style={styles.sectionLabel}>What happens next</Text>
            <View style={styles.timeline}>
              <TimelineItem
                title="Request logged"
                subtitle="We store your request and notify our team."
                complete
              />
              <TimelineItem
                title="Identity verification"
                subtitle="We’ll confirm account ownership before deletion."
                complete={false}
              />
              <TimelineItem
                title="Final confirmation"
                subtitle="We’ll email you to finalize deletion and provide a receipt."
                complete={false}
              />
            </View>
          </CardContent>
        </Card>

        {latestRequest && (
          <Card style={styles.card}>
            <CardContent>
              <Text style={styles.sectionLabel}>Latest request</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryBadge}>
                  <Ionicons name="time-outline" size={16} color={BrandColors.primary} />
                  <Text style={styles.summaryBadgeText}>Pending review</Text>
                </View>
                <Text style={styles.summaryDate}>
                  {new Date(latestRequest.createdAt).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.summaryText}>
                Reason: {reasons.find((r) => r.id === latestRequest.reason)?.label || latestRequest.reason}
              </Text>
              {latestRequest.details ? (
                <Text style={styles.summaryText}>Details: {latestRequest.details}</Text>
              ) : null}
              <Text style={styles.summaryContact}>We’ll reach out at {latestRequest.contact}</Text>
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const TimelineItem = ({
  title,
  subtitle,
  complete,
}: {
  title: string;
  subtitle: string;
  complete: boolean;
}) => (
  <View style={styles.timelineItem}>
    <View
      style={[
        styles.timelineIcon,
        complete ? styles.timelineIconComplete : styles.timelineIconPending,
      ]}
    >
      <Ionicons
        name={complete ? 'checkmark' : 'ellipse-outline'}
        size={16}
        color={complete ? TextColors.white : BrandColors.primary}
      />
    </View>
    <View style={styles.timelineText}>
      <Text style={styles.timelineTitle}>{title}</Text>
      <Text style={styles.timelineSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: BackgroundColors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backButton: { marginLeft: -8 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TextColors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: TextColors.tertiary,
    marginTop: 4,
  },
  heroCard: {
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: BackgroundColors.primary,
  },
  heroRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E7F2EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1 },
  heroTitle: { fontSize: 16, fontWeight: '700', color: TextColors.primary },
  heroText: { color: TextColors.secondary, marginTop: 4, lineHeight: 20 },
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
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: TextColors.primary,
    marginBottom: 12,
  },
  reasonsGrid: { gap: 10 },
  reasonChip: {
    borderWidth: 1,
    borderColor: '#d9e2e9',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  reasonChipActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#e7f2ec',
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: TextColors.primary,
    marginBottom: 4,
  },
  reasonLabelActive: { color: BrandColors.primary },
  reasonSubtitle: { color: TextColors.secondary, fontSize: 13, lineHeight: 18 },
  spacingTop: { marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    backgroundColor: BackgroundColors.primary,
    color: TextColors.primary,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cfd8dc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BackgroundColors.primary,
  },
  checkboxChecked: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  checkboxText: { flex: 1, color: TextColors.primary, lineHeight: 20 },
  submitButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 16,
    borderRadius: 10,
  },
  submitButtonText: {
    color: TextColors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeline: { gap: 12 },
  timelineItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  timelineIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconComplete: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  timelineIconPending: {
    borderColor: '#d9e2e9',
    backgroundColor: '#f8fafc',
  },
  timelineText: { flex: 1 },
  timelineTitle: { fontWeight: '700', color: TextColors.primary, fontSize: 15 },
  timelineSubtitle: { color: TextColors.secondary, marginTop: 2, lineHeight: 19 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e7f2ec',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  summaryBadgeText: {
    color: BrandColors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  summaryDate: { color: TextColors.secondary, fontSize: 12 },
  summaryText: { color: TextColors.primary, marginBottom: 4, lineHeight: 20 },
  summaryContact: { color: TextColors.secondary, marginTop: 4, lineHeight: 20 },
});

export default AccountDeletionRequestScreen;


