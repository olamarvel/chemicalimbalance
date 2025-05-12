
import axios from 'axios';
import type { NafdacDrugInfo } from '@/types';

// Interface for the raw data item from NAFDAC API response
interface NafdacDataItem {
  sn: string;
  product_name: string | null;
  registration_number: string | null;
  holder: string | null;
  active_ingredients: string | null;
  [key: string]: any; // Allow other properties
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
 * @param rawIngredients The raw string from the API.
 * @returns An array of cleaned ingredient names.
 */
function parseActiveIngredients(rawIngredients: string | null): string[] {
  if (!rawIngredients) {
    return [];
  }
  // Normalize line breaks and remove HTML tags
  const cleaned = rawIngredients.replace(/\r<br \/>|\r\n|\n|<br \/>/g, ',').replace(/<[^>]*>/g, '');
  // Split by common delimiters and trim whitespace
  const ingredients = cleaned.split(/[,;]+/).map(ing => ing.trim()).filter(ing => ing.length > 0);
  // Further split ingredients that might be concatenated with ' HCL', ' HYDROCHLORIDE', etc.
  // This is a simple heuristic and might need refinement based on more examples.
  const finalIngredients: string[] = [];
  ingredients.forEach(ing => {
      // Remove common suffixes like HCL, HYDROCHLORIDE (case-insensitive) before adding
      const baseName = ing.replace(/\s+(HCL|HYDROCHLORIDE)$/i, '').trim();
      if (baseName) {
        finalIngredients.push(baseName);
      }
  });

  // Remove duplicates (case-insensitive check)
  const uniqueIngredients = Array.from(new Set(finalIngredients.map(s => s.toLowerCase())))
                               .map(lowerCaseIng => finalIngredients.find(s => s.toLowerCase() === lowerCaseIng)!);

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
    columns: [ // Define columns structure as expected by the API
      { data: 'sn', name: '', searchable: true, orderable: false, search: { value: '', regex: false } },
      { data: 'product_name', name: '', searchable: true, orderable: true, search: { value: '', regex: false } },
      { data: 'registration_number', name: '', searchable: true, orderable: true, search: { value: '', regex: false } },
      { data: 'holder', name: '', searchable: true, orderable: true, search: { value: '', regex: false } },
      { data: 'active_ingredients', name: '', searchable: true, orderable: true, search: { value: '', regex: false } },
      // Add more columns if needed, matching the API's expected structure
    ],
    order: [{ column: 1, dir: 'asc' }], // Order by product_name ascending
    start: 0, // Start index
    length: 50, // Max results to fetch (adjust as needed)
    search: { value: trimmedQuery, regex: false }, // The main search query
    _: Date.now(), // Cache-busting parameter
  };

  try {
    console.log(`Querying NAFDAC API for: "${trimmedQuery}" with params:`, params);
    const response = await axios.get<NafdacApiResponse>(NAFDAC_API_URL, {
      params,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest', // Important header for this API
         // Add other headers if necessary, like User-Agent
        'User-Agent': 'ChemicalImbalanceApp/1.0 (axios)'
      }
    });

    console.log('NAFDAC API Response Status:', response.status);
    console.log('NAFDAC API Response Data:', response.data);


    const results = response.data?.data || [];

     // Filter results more strictly based on the query matching product name or registration number
    const matches = results.filter(item =>
        (item.product_name && item.product_name.toLowerCase().includes(trimmedQuery.toLowerCase())) ||
        (item.registration_number && item.registration_number.toLowerCase().includes(trimmedQuery.toLowerCase()))
    );


    if (matches.length === 0) {
      console.log(`No exact match found for "${trimmedQuery}" in NAFDAC results.`);
      return null; // Return null if no matches found
    }

    // Return structured info for each match
    return matches.map(item => ({
      product_name: item.product_name || 'Unknown Product',
      nafdac_no: item.registration_number || 'Unknown NAFDAC No',
      active_ingredients: item.active_ingredients || '', // Return raw string for parsing later
    }));

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error fetching data from NAFDAC API for "${trimmedQuery}":`, error.message);
      console.error('NAFDAC API Request details:', error.config);
      if (error.response) {
        console.error('NAFDAC API Response status:', error.response.status);
        console.error('NAFDAC API Response data:', error.response.data);
      }
    } else {
      console.error(`An unexpected error occurred while fetching NAFDAC data for "${trimmedQuery}":`, error);
    }
    return null; // Return null on error
  }
}

// Export the parser function if needed elsewhere, or keep it internal
export { parseActiveIngredients };
