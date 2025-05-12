
import type { OpenFDASideEffectInfo } from '@/types';

const FDA_API_BASE_URL = 'https://api.fda.gov/drug';

// Interface for the OpenFDA Label API result structure (simplified)
interface FDALabelResult {
  openfda: {
    brand_name?: string[];
    generic_name?: string[];
    substance_name?: string[]; // Often contains the active ingredients
    manufacturer_name?: string[];
    [key: string]: any;
  };
  adverse_reactions?: string[];
  warnings?: string[];
  [key: string]: any;
}

/**
 * Fetches potential side effects from OpenFDA for a list of active ingredients.
 * @param ingredients An array of active ingredient names.
 * @returns A promise resolving to an OpenFDASideEffectInfo object containing a unique list of side effects, or null if no ingredients provided or error.
 */
export async function fetchSideEffectsForIngredients(ingredients: string[]): Promise<OpenFDASideEffectInfo | null> {
  if (!ingredients || ingredients.length === 0) {
    console.warn("No ingredients provided to fetch side effects for.");
    return { sideEffects: [] }; // Return empty if no ingredients
  }

  // Construct the search query for OpenFDA Label API
  // Search in substance_name, generic_name, or brand_name fields
  const ingredientQuery = ingredients
      .map(ing => `"${ing.trim()}"`) // Ensure ingredients are quoted
      .join('+OR+');
  const searchQuery = `(openfda.substance_name:(${ingredientQuery})+OR+openfda.generic_name:(${ingredientQuery})+OR+openfda.brand_name:(${ingredientQuery}))`;

  // Limit results to potentially reduce noise, increase if needed
  const limit = 5 * ingredients.length; // Fetch a few results per ingredient potentially
  const labelUrl = `${FDA_API_BASE_URL}/label.json?search=${searchQuery}&limit=${limit}`;

  console.log(`Querying OpenFDA Label API for ingredients: ${ingredients.join(', ')}`);
  console.log(`OpenFDA URL: ${labelUrl}`);


  try {
    const labelResponse = await fetch(labelUrl, {
      headers: { 'User-Agent': 'ChemicalImbalanceApp/1.0' }
    });

    if (!labelResponse.ok) {
      console.error(`Open FDA label API error for ingredients [${ingredients.join(', ')}]: ${labelResponse.status}`);
      // Return empty side effects on API error, maybe retry or log differently
      return { sideEffects: [] };
    }

    const labelData = await labelResponse.json();
    let collectedSideEffects: string[] = [];

    if (labelData.results && labelData.results.length > 0) {
       console.log(`Found ${labelData.results.length} potential label results from OpenFDA.`);
       labelData.results.forEach((result: FDALabelResult) => {
        // Prioritize adverse_reactions, then warnings
        if (result.adverse_reactions && result.adverse_reactions.length > 0) {
          collectedSideEffects.push(...result.adverse_reactions);
        } else if (result.warnings && result.warnings.length > 0) {
          // Prefix warnings to distinguish them if needed, or just add them
           collectedSideEffects.push(...result.warnings.map(w => `Warning: ${w}`));
        }
      });
    } else {
        console.log(`No label results found on OpenFDA for ingredients: ${ingredients.join(', ')}`);
    }

    // Deduplicate and clean up the collected side effects
    const uniqueSideEffects = Array.from(new Set(collectedSideEffects.map(s => s.trim()).filter(s => s.length > 0)));

    console.log(`Collected ${uniqueSideEffects.length} unique side effects/warnings from OpenFDA.`);


    return {
      sideEffects: uniqueSideEffects,
    };

  } catch (error) {
    console.error(`Failed to fetch or process side effects from OpenFDA for ingredients [${ingredients.join(', ')}]:`, error);
    return { sideEffects: [] }; // Return empty on unexpected errors
  }
}

// Remove the old fetchDrugDetailsFromFDA function as it's replaced by the NAFDAC + new OpenFDA logic flow
// export async function fetchDrugDetailsFromFDA(drugName: string): Promise<OpenFDADrugInfo | null> { ... }

