import type { DrugComponent, SideEffect } from '@/types';

export interface DrugInfo {
  components: DrugComponent[];
  sideEffects: SideEffect[];
}

export const dummyDrugData: Record<string, DrugInfo> = {
  "Paracetamol": {
    components: [{ name: "Acetaminophen" }],
    sideEffects: [
      { name: "Nausea" },
      { name: "Allergic reactions" },
      { name: "Liver damage (with overdose)" }
    ]
  },
  "Ibuprofen": {
    components: [{ name: "Propionic acid derivative" }],
    sideEffects: [
      { name: "Stomach upset" },
      { name: "Heartburn" },
      { name: "Dizziness" },
      { name: "Increased risk of heart attack or stroke" }
    ]
  },
  "Amoxicillin": {
    components: [{ name: "Penicillin-like antibiotic" }],
    sideEffects: [
      { name: "Diarrhea" },
      { name: "Nausea" },
      { name: "Rash" }
    ]
  },
  "Lisinopril": {
    components: [{ name: "ACE inhibitor" }],
    sideEffects: [
      { name: "Dry cough" },
      { name: "Dizziness" },
      { name: "Headache" }
    ]
  },
  "Metformin": {
    components: [{ name: "Biguanide" }],
    sideEffects: [
      { name: "Diarrhea" },
      { name: "Nausea" },
      { name: "Upset stomach" }
    ]
  }
};

export const getDrugInfo = (drugName: string): DrugInfo | null => {
  const normalizedDrugName = Object.keys(dummyDrugData).find(
    (key) => key.toLowerCase() === drugName.toLowerCase()
  );
  return normalizedDrugName ? dummyDrugData[normalizedDrugName] : null;
};
