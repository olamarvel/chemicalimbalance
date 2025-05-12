import axios from 'axios';
import type { NafdacDrugInfo } from '@/types';

// Interface for the raw data item from NAFDAC API response
interface NafdacDataItem {
  sn: string;
  product_name: string | null;
  registration_number: string | null; // NAFDAC number based on current column config
  holder: string | null;
  active_ingredients: string | null;  // Primary source for ingredients based on current column config
  
  // Optional fields that might be present if API returns more or based on other configs (like cURL example)
  NAFDAC?: string | null;             // Alternative key for NAFDAC number seen in cURL
  ingredient?: {                      // Nested ingredient object seen in cURL
    ingredient_name?: string | null;
    [key: string]: any; // Allow other properties within ingredient object
  } | null;
  composition?: string | null;        // Composition string seen in cURL
  [key: string]: any;                 // Allow other top-level properties
}

// Interface for the NAFDAC API response structure
interface NafdacApiResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: NafdacDataItem[];
  input: any;
}

const NAFDAC_API_URL = 'https://greenbook.nafdac.gov.ng/api/datatable/drugs';

/**
 * Parses the raw active ingredients string from NAFDAC API.
 * Handles variations like "Ingredient A\r<br />Ingredient B" or "Ingredient C, Ingredient D".
 * Cleans names by removing strengths, units, pharmacopoeia standards, and common salt forms.
 * @param rawIngredients The raw string from the API.
 * @returns An array of cleaned ingredient names.
 */
function parseActiveIngredients(rawIngredients: string | null): string[] {
  if (!rawIngredients || rawIngredients.trim() === "") {
    return [];
  }
  // Normalize line breaks and remove HTML tags
  const cleaned = rawIngredients.replace(/\r<br \/>|\r\n|\n|<br \/>/g, ',').replace(/<[^>]*>/g, '');
  // Split by common delimiters and trim whitespace
  const ingredients = cleaned.split(/[,;]+/).map(ing => ing.trim()).filter(ing => ing.length > 0);
  
  const finalIngredients: string[] = [];
  ingredients.forEach(ing => {
      // Remove strengths (e.g., 100mg, 500 mg, 2.5g, 10 IU)
      // Remove pharmacopoeia standards (e.g., BP, USP)
      // Remove common salt forms (e.g., HCL, Hydrochloride, Sodium, Maleate)
      // Order of removal can matter. Strength and BP/USP first.
      let baseName = ing
          .replace(/\s+\d+(\.\d+)?\s*(mg|g|ml|mcg|iu|units?)\b/gi, '') 
          .replace(/\s+(BP|USP|EP|JP)\b/gi, '')             
          .replace(/\s+(HCL|HYDROCHLORIDE|SODIUM|POTASSIUM|MALEATE|SUCCINATE|TARTRATE|PHOSPHATE|SULFATE|SULPHATE|ACETATE|BESYLATE|BESILATE|MESYLATE|CAMSYLATE|TOSYLATE)\b/gi, '')
          .trim();
      
      // Handle "Ingredient (as Salt)" pattern e.g., "Amlodipine (as Besylate)" -> "Amlodipine"
      const asSaltMatchParen = baseName.match(/^(.+?)\s+\(as\s+.+?\)$/i);
      if (asSaltMatchParen && asSaltMatchParen[1]) {
        baseName = asSaltMatchParen[1].trim();
      }
      // Handle "Ingredient as Salt" pattern e.g., "Amlodipine as Besylate" -> "Amlodipine"
      const asSaltMatchNoParen = baseName.match(/^(.+?)\s+as\s+(Besylate|Hydrochloride|Sodium|Maleate|Succinate|Tartrate|Phosphate|Sulfate|Sulphate|Acetate)\b/i);
      if (asSaltMatchNoParen && asSaltMatchNoParen[1]) {
          baseName = asSaltMatchNoParen[1].trim();
      }


      // Remove any remaining trailing conjunctions like 'and', 'or' if they were part of a badly split multi-ingredient string
      baseName = baseName.replace(/\s+(and|or)$/i, '').trim();

      if (baseName && baseName.length > 1) { // Ensure basename is not empty and somewhat substantial
        finalIngredients.push(baseName);
      }
  });

  // Remove duplicates (case-insensitive check)
  const uniqueIngredients = Array.from(new Set(finalIngredients.map(s => s.toLowerCase())))
                               .map(lowerCaseIng => finalIngredients.find(s => s.toLowerCase() === lowerCaseIng)!)
                               .filter(s => s); // Filter out potential undefined values if find fails (should not happen with this logic)

  return uniqueIngredients;
}


/**
 * Fetches active ingredients and product details from NAFDAC Greenbook API.
 * @param query The product name or NAFDAC registration number.
 * @returns A promise resolving to an array of NafdacDrugInfo objects or null if not found/error.
 */
export async function fetchNafdacDrugDetails(query: string): Promise<NafdacDrugInfo[] | null> {
  if (!query || query.trim() === '') {
    return null;
  }
  const trimmedQuery = query.trim();

  const params = {
    draw: 1,
    columns: [ 
      { data: 'sn', name: '', searchable: true, orderable: false, search: { value: '', regex: false } },
      { data: 'product_name', name: '', searchable: true, orderable: true, search: { value: '', regex: false } },
      { data: 'registration_number', name: '', searchable: true, orderable: true, search: { value: '', regex: false } },
      { data: 'holder', name: '', searchable: true, orderable: true, search: { value: '', regex: false } },
      { data: 'active_ingredients', name: '', searchable: true, orderable: true, search: { value: '', regex: false } },
    ],
    order: [{ column: 1, dir: 'asc' }], 
    start: 0, 
    length: 50, 
    search: { value: trimmedQuery, regex: false }, 
    _: Date.now(), 
  };

  try {
    console.log(`Querying NAFDAC API for: "${trimmedQuery}" with params:`, JSON.stringify(params, null, 2));
    const response = await axios.get<NafdacApiResponse>(NAFDAC_API_URL, {
      params,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest', 
        'User-Agent': 'ChemicalImbalanceApp/1.0 (axios)'
      }
    });

    console.log('NAFDAC API Response Status:', response.status);
    // console.log('NAFDAC API Response Data:', JSON.stringify(response.data, null, 2));


    const results = response.data?.data || [];

    const matches = results.filter(item =>
        (item.product_name && item.product_name.toLowerCase().includes(trimmedQuery.toLowerCase())) ||
        (item.registration_number && item.registration_number.toLowerCase().includes(trimmedQuery.toLowerCase())) ||
        (item.NAFDAC && item.NAFDAC.toLowerCase().includes(trimmedQuery.toLowerCase())) // Also check NAFDAC field if present
    );


    if (matches.length === 0) {
      console.log(`No relevant match found for "${trimmedQuery}" in NAFDAC results after filtering.`);
      return null; 
    }

    return matches.map(item => {
      let ingredientsString: string | null = null;

      if (item.active_ingredients && item.active_ingredients.trim() !== "") {
        ingredientsString = item.active_ingredients;
        console.log(`Using 'active_ingredients' field for ${item.product_name}: ${ingredientsString}`);
      } 
      else if (item.ingredient && item.ingredient.ingredient_name && item.ingredient.ingredient_name.trim() !== "") {
        ingredientsString = item.ingredient.ingredient_name;
        console.log(`Using 'ingredient.ingredient_name' field for ${item.product_name}: ${ingredientsString}`);
      } 
      else if (item.composition && item.composition.trim() !== "") {
        // Simplistic extraction from composition: "Each ... contains: Actual Ingredient Name [Strength]"
        const compMatch = item.composition.match(/contains:\s*([^(\r\n<]+?(\s+\d+(\.\d+)?\s*(mg|g|ml|mcg|iu))?)/i);
        if (compMatch && compMatch[1]) {
          ingredientsString = compMatch[1].trim();
           console.log(`Using parsed 'composition' field for ${item.product_name}: ${ingredientsString}`);
        } else {
           console.log(`Could not parse 'composition' for ${item.product_name}: ${item.composition}`);
        }
      } else {
        console.log(`No ingredient source found for ${item.product_name} in item:`, item);
      }
      
      return {
        product_name: item.product_name || 'Unknown Product',
        nafdac_no: item.registration_number || item.NAFDAC || 'Unknown NAFDAC No',
        active_ingredients: ingredientsString || '', 
      };
    });

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error fetching data from NAFDAC API for "${trimmedQuery}":`, error.message);
      if (error.config) console.error('NAFDAC API Request config:', error.config);
      if (error.response) {
        console.error('NAFDAC API Response status:', error.response.status);
        console.error('NAFDAC API Response data:', error.response.data);
      }
    } else {
      console.error(`An unexpected error occurred while fetching NAFDAC data for "${trimmedQuery}":`, error);
    }
    return null; 
  }
}

export { parseActiveIngredients };