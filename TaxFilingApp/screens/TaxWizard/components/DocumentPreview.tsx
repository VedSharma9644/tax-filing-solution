import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UploadedDocument } from '../types';
import { formatFileSize, getStatusColor } from '../utils/documentUtils';

interface DocumentPreviewProps {
  document: UploadedDocument;
  onDelete?: () => void;
  onReplace?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  onDelete,
  onReplace,
  showActions = true,
  compact = false,
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isImage = document.isImage || 
    document.type?.startsWith('image/') || 
    document.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  const previewUrl = document.uri || document.previewUrl || document.publicUrl;
  
  // Debug logging
  console.log(`🖼️ DocumentPreview - Name: ${document.name}, IsImage: ${isImage}, URL: ${previewUrl}`);


  const handleImageError = (error: any) => {
    console.log(`❌ Image load error for ${document.name}:`, error.nativeEvent?.error || error);
    setImageError(true);
  };

  const openPreview = () => {
    if (isImage && previewUrl) {
      setPreviewVisible(true);
    }
  };

  const handleViewDocument = () => {
    if (previewUrl) {
      // For decrypted documents, open in browser
      Linking.openURL(previewUrl).catch(err => {
        console.error('Failed to open document:', err);
      });
    }
  };

  const closePreview = () => {
    setPreviewVisible(false);
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity 
          style={styles.compactPreview} 
          onPress={openPreview}
          disabled={!isImage || !previewUrl}
        >
          {isImage && previewUrl && !imageError ? (
            <Image
              source={{ uri: previewUrl }}
              style={styles.compactImage}
              onError={handleImageError}
            />
          ) : (
            <View style={styles.compactIconContainer}>
              <Ionicons 
                name={isImage ? "image-outline" : "document-outline"} 
                size={20} 
                color="#666" 
              />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>
            {document.name}
          </Text>
          <Text style={styles.compactSize}>
            {formatFileSize(document.size)}
          </Text>
        </View>

        {showActions && (
          <View style={styles.compactActions}>
            {onReplace && (
              <TouchableOpacity onPress={onReplace} style={styles.actionButton}>
                <Ionicons name="refresh-outline" size={16} color="#007bff" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={16} color="#dc3545" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>{document.name}</Text>
            <Text style={styles.documentSize}>{formatFileSize(document.size)}</Text>
            <Text style={styles.documentType}>{document.type}</Text>
          </View>
          
          <View style={styles.documentActions}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(document.status) }]}>
              <Text style={styles.statusText}>{document.status}</Text>
            </View>
            
            {showActions && (
              <>
                {onReplace && (
                  <TouchableOpacity onPress={onReplace} style={styles.actionButton}>
                    <Ionicons name="refresh-outline" size={20} color="#007bff" />
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                    <Ionicons name="trash-outline" size={20} color="#dc3545" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        {document.status === 'uploading' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${document.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{document.progress}%</Text>
          </View>
        )}

        {/* Document Preview */}
        {isImage && previewUrl && (
          <View style={styles.previewContainer}>
            {/* Show actual image if it's a data URL (cached) */}
            {previewUrl.startsWith('data:') ? (
              <TouchableOpacity onPress={openPreview}>
                <Image
                  source={{ uri: previewUrl }}
                  style={styles.previewImage}
                  onError={handleImageError}
                />
                <View style={styles.previewOverlay}>
                  <Ionicons name="eye-outline" size={24} color="#fff" />
                  <Text style={styles.previewText}>Tap to view</Text>
                </View>
              </TouchableOpacity>
            ) : (
              /* Show icon and view button for decryption URLs */
              <>
                <View style={styles.documentIconContainer}>
                  <Ionicons name="image-outline" size={48} color="#666" />
                  <Text style={styles.documentIconText}>Image Document</Text>
                </View>
                <TouchableOpacity style={styles.viewButton} onPress={handleViewDocument}>
                  <Ionicons name="eye-outline" size={20} color="#007bff" />
                  <Text style={styles.viewButtonText}>View Document</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}


        {/* Non-image document icon */}
        {!isImage && previewUrl && (
          <View style={styles.previewContainer}>
            <View style={styles.documentIconContainer}>
              <Ionicons name="document-outline" size={48} color="#666" />
              <Text style={styles.documentIconText}>Document</Text>
            </View>
            <TouchableOpacity style={styles.viewButton} onPress={handleViewDocument}>
              <Ionicons name="eye-outline" size={20} color="#007bff" />
              <Text style={styles.viewButtonText}>View Document</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error state */}
        {document.status === 'error' && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#dc3545" />
            <Text style={styles.errorText}>Upload failed</Text>
          </View>
        )}
      </View>

      {/* Full Screen Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{document.name}</Text>
            <TouchableOpacity onPress={closePreview} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <Image
              source={{ uri: previewUrl }}
              style={styles.fullImage}
              onError={handleImageError}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  documentSize: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    color: '#999',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    padding: 8,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  previewContainer: {
    marginTop: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  previewText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
  },
  documentIconContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 12,
  },
  documentIconText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007bff',
    marginTop: 12,
  },
  viewButtonText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    color: '#721c24',
    marginLeft: 8,
    fontSize: 14,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  compactPreview: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  compactIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  compactSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  compactActions: {
    flexDirection: 'row',
    gap: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  fullImage: {
    width: width,
    height: height * 0.8,
    resizeMode: 'contain',
  },
});

export default DocumentPreview;
