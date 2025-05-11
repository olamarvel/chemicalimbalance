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
  medicalConditions: string;
}
