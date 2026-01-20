import AsyncStorage from '@react-native-async-storage/async-storage';

type DeletionRequest = {
  id: string;
  reason: string;
  details?: string;
  contact: string;
  acknowledged: boolean;
  status: 'pending_review';
  createdAt: string;
};

const storageKey = (userId?: string) =>
  `account_deletion_requests_${userId || 'guest'}`;

export const getDeletionRequests = async (
  userId?: string
): Promise<DeletionRequest[]> => {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to load deletion requests', error);
    return [];
  }
};

export const saveDeletionRequest = async (
  request: Omit<DeletionRequest, 'id' | 'status' | 'createdAt'>,
  userId?: string
): Promise<DeletionRequest> => {
  const newRequest: DeletionRequest = {
    id: `${Date.now()}`,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    ...request,
  };

  try {
    const existing = await getDeletionRequests(userId);
    const updated = [newRequest, ...existing];
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save deletion request', error);
  }

  return newRequest;
};


