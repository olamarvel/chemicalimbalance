
export interface DrugComponent {
  name: string;
}

export interface SideEffect {
  name: string;
}

export interface Report {
  drugName: string;
  components: DrugComponent[];
  sideEffects: SideEffect[];
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
