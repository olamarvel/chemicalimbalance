
import type { DrugComponent, OpenFDADrugInfo } from '@/types';

const FDA_API_BASE_URL = 'https://api.fda.gov/drug';

interface FDAFDAResult {
  application_number: string;
  sponsor_name: string;
  products: {
    product_number: string;
    brand_name: string;
    active_ingredients: {
      name: string;
      strength: string;
    }[];
    dosage_form: string;
    route: string;
    marketing_status: string;
  }[];
  openfda: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
    [key: string]: any;
  };
}

interface FDALabelResult {
  openfda: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
    [key: string]: any;
  };
  adverse_reactions?: string[];
  warnings?: string[];
  [key: string]: any;
}


export async function fetchDrugDetailsFromFDA(drugName: string): Promise<OpenFDADrugInfo | null> {
  if (!drugName || drugName.trim() === '') {
    return null;
  }
  const encodedDrugName = encodeURIComponent(drugName.trim());

  try {
    // Fetch components (active ingredients)
    const drugSFDAUrl = `${FDA_API_BASE_URL}/drugsfda.json?search=(openfda.brand_name.exact:"${encodedDrugName}"+OR+openfda.generic_name.exact:"${encodedDrugName}")&limit=1`;
    const fdaResponse = await fetch(drugSFDAUrl, { headers: { 'User-Agent': 'ChemicalImbalanceApp/1.0' } });

    if (!fdaResponse.ok) {
      console.error(`OpenFDA drugsfda API error for ${drugName}: ${fdaResponse.status}`);
      // If primary drug info fails, don't proceed to label info for this simple implementation
      return null; 
    }

    const fdaData = await fdaResponse.json();

    let components: DrugComponent[] = [];
    if (fdaData.results && fdaData.results.length > 0) {
      const result = fdaData.results[0] as FDAFDAResult;
      if (result.products && result.products.length > 0 && result.products[0].active_ingredients) {
        components = result.products[0].active_ingredients.map(ing => ({ name: ing.name }));
      }
    }
     // If no components found from drugS FDA, it might not be a recognized drug.
    if (components.length === 0) {
        // Attempt to use generic name from label if brand name search yielded no components.
        // This scenario is less likely if search includes generic_name already.
        console.warn(`No active ingredients found for ${drugName} via drugS FDA. Returning no components.`);
    }


    // Fetch side effects (adverse reactions) from label information
    const labelUrl = `${FDA_API_BASE_URL}/label.json?search=(openfda.brand_name.exact:"${encodedDrugName}"+OR+openfda.generic_name.exact:"${encodedDrugName}")&limit=1`;
    const labelResponse = await fetch(labelUrl, { headers: { 'User-Agent': 'ChemicalImbalanceApp/1.0' } });
    
    let sideEffects: string[] = [];
    if (labelResponse.ok) {
      const labelData = await labelResponse.json();
      if (labelData.results && labelData.results.length > 0) {
        const result = labelData.results[0] as FDALabelResult;
        if (result.adverse_reactions && result.adverse_reactions.length > 0) {
          sideEffects = result.adverse_reactions;
        } else if (result.warnings && result.warnings.length > 0) {
          // Fallback to warnings if adverse_reactions is not present
          sideEffects = [`Potential warnings: ${result.warnings.join(' ')}`];
        }
      }
    } else {
      console.warn(`OpenFDA label API error for ${drugName}: ${labelResponse.status}. Proceeding without side effects.`);
    }
    
    // If no components were found but we found side effects, it's an inconsistent state.
    // For this application, we require components to consider it a valid drug.
    if (components.length === 0 && sideEffects.length > 0) {
        console.warn(`Found side effects for ${drugName} but no components. Treating as 'not found'.`);
        return null;
    }
    
    // If after all attempts, we still have no components, consider the drug not found or info incomplete.
    if (components.length === 0) {
        return null;
    }

    return {
      components,
      sideEffects,
    };

  } catch (error) {
    console.error(`Failed to fetch drug details for ${drugName} from OpenFDA:`, error);
    return null;
  }
}

