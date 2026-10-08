import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { EngineeringCollege, CollegeSearchParams } from '../../types/college';
import { ENGINEERING_COLLEGES_DATASET, INDIAN_STATES } from '../../data/engineeringColleges';

export { INDIAN_STATES };

/**
 * Normalizes text for matching by removing special characters and extra spaces.
 */
function normalizeQuery(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ');
}

/**
 * Searches engineering colleges using local official AISHE dataset as the primary/fallback
 * fast search engine, with Supabase database integration when available.
 * 
 * Supports:
 * - Partial name search
 * - Case-insensitive search
 * - Abbreviation search (e.g., "BEC", "RV", "RVCE", "BMS", "NITK", "COEP")
 * - City search (e.g., "bengaluru", "belgaum", "bagalkot", "pune", "mumbai")
 * - State search (e.g., "karnataka", "maharashtra")
 * - AISHE code search (e.g., "C-1342", "U-0237")
 */
export async function searchColleges(params: CollegeSearchParams = {}): Promise<EngineeringCollege[]> {
  const { query = '', state = '', limit = 30 } = params;
  const trimmedQuery = query.trim().toLowerCase();
  const normalizedQ = normalizeQuery(query);

  // If Supabase is available, attempt querying Supabase colleges table first
  if (isSupabaseConfigured() && trimmedQuery.length >= 2) {
    try {
      let dbQuery = supabase
        .from('colleges')
        .select('id, name, state, city, aishe_code, college_type, created_at')
        .limit(limit);

      if (state && state.trim()) {
        dbQuery = dbQuery.eq('state', state.trim());
      }

      // Try searching by name or city or state
      dbQuery = dbQuery.or(
        `name.ilike.%${trimmedQuery}%,city.ilike.%${trimmedQuery}%,state.ilike.%${trimmedQuery}%,aishe_code.ilike.%${trimmedQuery}%`
      );

      const { data, error } = await dbQuery;

      if (!error && data && data.length > 0) {
        return data as EngineeringCollege[];
      }
    } catch {
      // Graceful fallback to rich local dataset
    }
  }

  // Local dataset search with comprehensive indexing & scoring
  let results = ENGINEERING_COLLEGES_DATASET;

  // Filter by state if specified
  if (state && state.trim()) {
    const filterState = state.trim().toLowerCase();
    results = results.filter((col) => col.state.toLowerCase() === filterState);
  }

  // If no query string, return top list up to limit
  if (!trimmedQuery) {
    return results.slice(0, limit);
  }

  const scoredResults: { college: EngineeringCollege; score: number }[] = [];

  for (const college of results) {
    const colNameLower = college.name.toLowerCase();
    const cityLower = college.city.toLowerCase();
    const stateLower = college.state.toLowerCase();
    const aisheLower = college.aishe_code.toLowerCase();
    const typeLower = college.college_type.toLowerCase();
    const abbreviations = college.abbreviations || [];

    let score = 0;

    // 1. Exact abbreviation match (e.g. "RV", "BEC", "BMS", "NITK") -> highest priority
    const matchedAbbr = abbreviations.find(
      (abbr) => abbr.toLowerCase() === trimmedQuery
    );
    if (matchedAbbr) {
      score += 1000;
    } else {
      const partialAbbr = abbreviations.find((abbr) =>
        abbr.toLowerCase().includes(trimmedQuery)
      );
      if (partialAbbr) {
        score += 500;
      }
    }

    // 2. Exact college name start match
    if (colNameLower.startsWith(trimmedQuery)) {
      score += 300;
    } else if (colNameLower.includes(trimmedQuery)) {
      score += 200;
    }

    // 3. City exact / start match (e.g., "bengaluru", "belgaum", "bagalkot")
    if (cityLower === trimmedQuery) {
      score += 250;
    } else if (cityLower.startsWith(trimmedQuery)) {
      score += 180;
    } else if (cityLower.includes(trimmedQuery)) {
      score += 120;
    }

    // 4. AISHE code match
    if (aisheLower.includes(trimmedQuery)) {
      score += 220;
    }

    // 5. State match
    if (stateLower === trimmedQuery) {
      score += 150;
    } else if (stateLower.includes(trimmedQuery)) {
      score += 80;
    }

    // 6. Word by word fuzzy match
    const queryWords = normalizedQ.split(/\s+/).filter(Boolean);
    if (queryWords.length > 1) {
      const combinedText = `${colNameLower} ${cityLower} ${stateLower} ${abbreviations.join(' ').toLowerCase()}`;
      const allWordsPresent = queryWords.every((word) => combinedText.includes(word));
      if (allWordsPresent) {
        score += 160;
      }
    }

    // 7. College type match (e.g. "autonomous", "government")
    if (typeLower.includes(trimmedQuery)) {
      score += 50;
    }

    if (score > 0) {
      scoredResults.push({ college, score });
    }
  }

  // Sort descending by relevance score
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, limit).map((item) => item.college);
}

/**
 * Retrieves a college by its unique identifier.
 */
export async function getCollegeById(id: string): Promise<EngineeringCollege | null> {
  if (!id) return null;

  // Search local dataset first
  const found = ENGINEERING_COLLEGES_DATASET.find((c) => c.id === id);
  if (found) return found;

  // Fallback to Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return data as EngineeringCollege;
      }
    } catch {
      // Ignore
    }
  }

  return null;
}

/**
 * Finds a matching college by college name string.
 * Useful for migrating legacy user profiles having free-text college_name.
 */
export function findCollegeByName(name: string): EngineeringCollege | null {
  if (!name || !name.trim()) return null;
  const cleanName = name.trim().toLowerCase();

  // Exact match
  const exact = ENGINEERING_COLLEGES_DATASET.find(
    (c) => c.name.toLowerCase() === cleanName
  );
  if (exact) return exact;

  // Normalized substring match
  const partial = ENGINEERING_COLLEGES_DATASET.find((c) => {
    const cLower = c.name.toLowerCase();
    return cLower.includes(cleanName) || cleanName.includes(cLower);
  });

  return partial || null;
}
