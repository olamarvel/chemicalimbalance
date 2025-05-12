
export interface DrugComponent {
  name: string;
  // strength might be available from API, can be added if needed later
  // strength?: string;
}

export interface Report {
  drugName: string; // Can be the name or NAFDAC number used for lookup
  productName?: string; // Actual product name from NAFDAC if found
  nafdacNo?: string; // NAFDAC registration number if found
  components: DrugComponent[];
  sideEffects: string[]; // AI-processed side effects from OpenFDA based on components
  aiSummary: string;
  timestamp: string;
}

// Used for the form
export interface DrugAnalysisInput {
  drugName: string; // User input: Can be drug name or NAFDAC number
  medicalConditions?: string; // Make optional to align with form field
}

// Types for ExtractDrugInfoFromImage flow
export interface ExtractDrugInfoInput {
  photoDataUri: string;
}

export interface ExtractDrugInfoOutput {
  drugName: string;
}

// Type for fetching component data from NAFDAC
export interface NafdacDrugInfo {
  product_name: string;
  nafdac_no: string;
  active_ingredients: string; // Raw string from API, needs parsing
}

// Type for fetching side effect data from OpenFDA based on components
export interface OpenFDASideEffectInfo {
  sideEffects: string[]; // Raw side effects from OpenFDA for given ingredients
}

