import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import ImageCacheService from '../services/imageCacheService';
import { BackgroundColors } from '../utils/colors';

interface CacheStats {
  entryCount: number;
  totalSize: number;
  totalSizeMB: string;
  maxSizeMB: string;
  usagePercent: string;
}

const CacheManagementScreen = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCacheStats = async () => {
    try {
      setLoading(true);
      const stats = await ImageCacheService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error loading cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCacheStats();
  }, []);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Image Cache',
      'This will remove all cached images. They will need to be re-downloaded when you view documents. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await ImageCacheService.clearAllCache();
              await loadCacheStats();
              Alert.alert('Success', 'Image cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  const handleCleanupCache = async () => {
    try {
      await ImageCacheService.cleanupCache();
      await loadCacheStats();
      Alert.alert('Success', 'Cache cleanup completed');
    } catch (error) {
      Alert.alert('Error', 'Failed to cleanup cache');
    }
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Cache Management</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text>Loading cache information...</Text>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cache Management</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Cache Statistics */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Cache Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {cacheStats ? (
                <View style={styles.statsContainer}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Cached Images:</Text>
                    <Text style={styles.statValue}>{cacheStats.entryCount}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Size:</Text>
                    <Text style={styles.statValue}>{cacheStats.totalSizeMB} MB</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Max Size:</Text>
                    <Text style={styles.statValue}>{cacheStats.maxSizeMB} MB</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Usage:</Text>
                    <Text style={[styles.statValue, { color: parseFloat(cacheStats.usagePercent) > 80 ? '#e74c3c' : '#28a745' }]}>
                      {cacheStats.usagePercent}%
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.noDataText}>No cache data available</Text>
              )}
            </CardContent>
          </Card>

          {/* Cache Actions */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Cache Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.actionsContainer}>
                <Button 
                  style={styles.actionButton} 
                  onPress={loadCacheStats}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Refresh Stats</Text>
                </Button>

                <Button 
                  style={[styles.actionButton, styles.cleanupButton]} 
                  onPress={handleCleanupCache}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Cleanup Old Files</Text>
                </Button>

                <Button 
                  style={[styles.actionButton, styles.clearButton]} 
                  onPress={handleClearCache}
                >
                  <Ionicons name="warning" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Clear All Cache</Text>
                </Button>
              </View>
            </CardContent>
          </Card>

          {/* Cache Information */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>About Image Cache</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.infoText}>
                The image cache stores decrypted images locally to provide instant viewing in the document review screen. 
                Images are automatically downloaded in the background when you visit the dashboard.
              </Text>
              <Text style={styles.infoText}>
                • Cached images are stored securely on your device{'\n'}
                • Cache is automatically cleaned up when it exceeds 50MB{'\n'}
                • Images older than 24 hours may be removed during cleanup{'\n'}
                • Clearing cache will require re-downloading images
              </Text>
            </CardContent>
          </Card>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BackgroundColors.secondary,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: BackgroundColors.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  statsContainer: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    minHeight: 44,
  },
  cleanupButton: {
    backgroundColor: '#ffc107',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
  },
});

export default CacheManagementScreen;

