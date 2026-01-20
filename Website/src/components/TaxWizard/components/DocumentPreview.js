import React, { useState } from 'react';
import './DocumentPreview.css';
import { API_BASE_URL } from '../../../config/api';

const DocumentPreview = ({ document, onDelete, onReplace, onImageLoad, onImageError, imageLoading, imageError, showActions = true }) => {
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageErrorState, setImageErrorState] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (document.type?.startsWith('image/')) {
      return '🖼️';
    } else if (document.type === 'application/pdf') {
      return '📄';
    } else {
      return '📎';
    }
  };

  const getViewUrl = () => {
    const url = document.publicUrl || document.uri || document.previewUrl;
    if (!url) return null;
    
    // If it's a gs:// URL, we need to use the decryption endpoint
    if (url.startsWith('gs://')) {
      const gcsPath = url.replace('gs://tax-filing-documents-tax-filing-app-3649f/', '');
      return `${API_BASE_URL}/upload/view/${encodeURIComponent(gcsPath)}`;
    }
    return url;
  };

  const handleView = () => {
    const viewUrl = getViewUrl();
    if (viewUrl) {
      window.open(viewUrl, '_blank');
    }
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
    if (onImageLoad) onImageLoad();
  };

  const handleImageError = () => {
    setIsImageLoading(false);
    setImageErrorState(true);
    if (onImageError) onImageError();
  };

  // Determine if we should show image preview
  const isImage = document.isImage || document.type?.startsWith('image/') || 
    !!(document.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
  const imageUrl = getViewUrl(); // Use the same URL logic for preview
  const shouldShowImage = isImage && imageUrl && !imageErrorState && !imageError;

  return (
    <div className="document-preview">
      <div className="document-preview-content">
        {shouldShowImage ? (
          <div className="document-preview-image-container">
            {(isImageLoading || imageLoading) && (
              <div className="document-preview-loading">
                <div className="document-preview-spinner"></div>
              </div>
            )}
            <img
              src={imageUrl}
              alt={document.name}
              className="document-preview-image"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: (isImageLoading || imageLoading) ? 'none' : 'block' }}
              onClick={handleView}
              title="Click to view"
            />
          </div>
        ) : (
          <div className="document-preview-icon" onClick={handleView} title="Click to view">
            <span className="document-preview-icon-text">{getFileIcon()}</span>
          </div>
        )}
        
        <div className="document-preview-info">
          <p className="document-preview-name" title={document.name}>{document.name}</p>
          <p className="document-preview-size">{formatFileSize(document.size)}</p>
          {document.status === 'uploading' && (
            <div className="document-preview-progress">
              <div 
                className="document-preview-progress-bar" 
                style={{ width: `${document.progress || 0}%` }}
              ></div>
            </div>
          )}
          {document.status === 'error' && (
            <p className="document-preview-error">Upload failed</p>
          )}
        </div>
      </div>
      
      {showActions && (
        <div className="document-preview-actions">
          {(document.publicUrl || document.uri) && (
            <button
              className="document-preview-view"
              onClick={handleView}
              title="View document"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              className="document-preview-delete"
              onClick={onDelete}
              title="Delete document"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;

