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

// Dependents interfaces
export interface Dependent {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth: string;
  age: string;
  ssn?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DependentFormData {
  name: string;
  relationship: string;
  dateOfBirth: string;
  age: string;
  ssn?: string;
  customRelationship?: string;
}

export interface DependentsManagementProps {
  applicationId: string;
  userId: string;
  token: string;
  initialDependents: Dependent[];
  initialDocuments: UploadedDocument[];
  onDependentsUpdate: (dependents: Dependent[]) => void;
  onDocumentsUpdate: (documents: UploadedDocument[]) => void;
}

export interface DependentFormProps {
  initialData?: Partial<DependentFormData>;
  isEditMode: boolean;
  onSubmit: (data: DependentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  onUploadDocument?: (file: any) => Promise<void>;
  documents?: UploadedDocument[];
  onRemoveDocument?: (documentId: string) => Promise<void>;
}

// Common relationships for dropdown
export const COMMON_RELATIONSHIPS = [
  'Spouse',
  'Child',
  'Son',
  'Daughter',
  'Stepchild',
  'Adopted Child',
  'Foster Child',
  'Grandchild',
  'Parent',
  'Father',
  'Mother',
  'Stepparent',
  'Sibling',
  'Brother',
  'Sister',
  'Other'
] as const;

// Personal Information interfaces
export interface PersonalInfoManagementProps {
  applicationId: string;
  userId: string;
  token: string;
  initialSsn: string;
  initialDocuments: UploadedDocument[];
  onSsnUpdate: (ssn: string) => void;
  onDocumentsUpdate: (documents: UploadedDocument[]) => void;
}

// W-2 Forms interfaces
export interface W2FormsManagementProps {
  applicationId: string;
  userId: string;
  token: string;
  initialDocuments: UploadedDocument[];
  onDocumentsUpdate: (documents: UploadedDocument[]) => void;
}
