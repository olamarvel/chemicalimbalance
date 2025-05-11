
export interface DrugComponent {
  name: string;
  // strength might be available from API, can be added if needed later
  // strength?: string; 
}

// This type is no longer used as side effects will be represented as raw strings from the API.
// export interface SideEffect {
//   name: string;
// }

export interface Report {
  drugName: string;
  components: DrugComponent[];
  sideEffects: string[]; // Changed from SideEffect[] to string[]
  aiSummary: string;
  timestamp: string;
}

// Used for the form
export interface DrugAnalysisInput {
  drugName: string;
  medicalConditions?: string; // Make optional to align with form field
}

// Types for ExtractDrugInfoFromImage flow
export interface ExtractDrugInfoInput {
  photoDataUri: string;
}

export interface ExtractDrugInfoOutput {
  drugName: string;
}

// Internal type for fetching data from OpenFDA
export interface OpenFDADrugInfo {
  components: DrugComponent[];
  sideEffects: string[];
}
