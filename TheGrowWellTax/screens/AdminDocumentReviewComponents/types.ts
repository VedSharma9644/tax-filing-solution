// Types and interfaces for Admin Document Review Components

export interface AdditionalIncomeSource {
  id: string;
  source: string;
  amount: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  category: string;
  gcsPath: string;
  publicUrl: string;
  status: 'pending' | 'completed' | 'error';
  uploadedAt: string;
}

export interface IncomeSourceFormData {
  source: string;
  amount: string;
  description: string;
  customSource?: string;
}

export interface SectionSelectorProps {
  activeSection: 'additional-income' | 'dependents' | 'personal-info';
  onSectionChange: (section: 'additional-income' | 'dependents' | 'personal-info') => void;
}

export interface AdditionalIncomeManagementProps {
  applicationId: string;
  userId: string;
  token: string;
  initialIncomeSources: AdditionalIncomeSource[];
  initialDocuments: UploadedDocument[];
  onIncomeSourcesUpdate: (sources: AdditionalIncomeSource[]) => void;
  onDocumentsUpdate: (documents: UploadedDocument[]) => void;
}

export interface IncomeSourceFormProps {
  initialData?: Partial<IncomeSourceFormData>;
  isEditMode: boolean;
  onSubmit: (data: IncomeSourceFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  onUploadDocument?: (file: any) => Promise<void>;
  documents?: UploadedDocument[];
  onRemoveDocument?: (documentId: string) => Promise<void>;
}

export interface DocumentManagementProps {
  documents: UploadedDocument[];
  onUploadDocument: (file: File) => Promise<void>;
  onRemoveDocument: (documentId: string) => Promise<void>;
  isLoading?: boolean;
}

// Common income sources for dropdown
export const COMMON_INCOME_SOURCES = [
  'Investment Income (Stocks, Bonds)',
  'Rental Income',
  'Freelance/Self-Employment',
  'Interest Income (Savings, CDs)',
  'Dividend Income',
  'Capital Gains (Property Sale)',
  'Business Income',
  'Royalty Income',
  'Pension/Annuity Income',
  'Unemployment Benefits',
  'Social Security Benefits',
  'Other'
] as const;

// Validation schemas
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
