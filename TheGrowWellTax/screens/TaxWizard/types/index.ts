export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  category: string;
  uri?: string;
  timestamp: Date;
  gcsPath?: string; // Google Cloud Storage path
  publicUrl?: string; // Public URL for accessing the document
  previewUrl?: string; // URL for preview (local URI or GCS URL)
  isImage?: boolean; // Whether the document is an image that can be previewed
}

export interface Dependent {
  id: string;
  name: string;
  age: string;
  relationship: string;
}

export interface AdditionalIncomeSource {
  id: string;
  source: string;
  amount: string;
  description?: string;
  documents?: UploadedDocument[];
}

export interface TaxFormData {
  // Personal Information
  socialSecurityNumber: string;
  
  // Tax Documents (Step 1)
  previousYearTaxDocuments: UploadedDocument[];
  w2Forms: UploadedDocument[];
  
  // Additional Income (Step 2)
  hasAdditionalIncome: boolean;
  additionalIncomeSources: AdditionalIncomeSource[];
  additionalIncomeGeneralDocuments: UploadedDocument[]; // Documents not tied to specific income sources
  
  // Deduction Documents (Step 3)
  medicalDocuments: UploadedDocument[];
  educationDocuments: UploadedDocument[];
  dependentChildrenDocuments: UploadedDocument[];
  homeownerDeductionDocuments: UploadedDocument[];
  
  // Personal Documents (Step 4)
  personalIdDocuments: UploadedDocument[];
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}
