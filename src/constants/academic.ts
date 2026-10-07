/**
 * Academic Year and Semester mappings for StudyMate AI.
 * Standard 4-Year Engineering Degree specification:
 * - 1st Year: 1st Semester, 2nd Semester
 * - 2nd Year: 3rd Semester, 4th Semester
 * - 3rd Year: 5th Semester, 6th Semester
 * - 4th Year: 7th Semester, 8th Semester
 */

export const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
] as const;

export type AcademicYear = (typeof YEAR_OPTIONS)[number];

export const semestersByYear: Record<string, string[]> = {
  '1st Year': ['1st Semester', '2nd Semester'],
  '2nd Year': ['3rd Semester', '4th Semester'],
  '3rd Year': ['5th Semester', '6th Semester'],
  '4th Year': ['7th Semester', '8th Semester'],
};

// Reusable export aliases
export const SEMESTERS_BY_YEAR = semestersByYear;

/**
 * Returns available semesters for a given year.
 */
export function getSemestersForYear(year: string | null | undefined): string[] {
  if (!year) return [];
  return semestersByYear[year] || [];
}

/**
 * Checks if a given semester is valid for the specified year.
 */
export function isSemesterValidForYear(
  year: string | null | undefined,
  semester: string | null | undefined
): boolean {
  if (!year || !semester) return false;
  const validList = semestersByYear[year] || [];
  return validList.includes(semester);
}

/**
 * Normalizes legacy or numerical semester representations (e.g. "Semester 1", "Sem 2", "3")
 * to the standardized form "1st Semester", "2nd Semester", etc.
 */
export function normalizeSemester(sem: string | null | undefined): string {
  if (!sem) return '';
  const trimmed = sem.trim();

  // If already matches standard format (e.g. "1st Semester", "4th Semester")
  const standardMatch = trimmed.match(/^([1-8])(st|nd|rd|th)\s+Semester$/i);
  if (standardMatch) {
    const num = standardMatch[1];
    const suffix = num === '1' ? 'st' : num === '2' ? 'nd' : num === '3' ? 'rd' : 'th';
    return `${num}${suffix} Semester`;
  }

  // Check for digits (e.g. "Semester 3", "Sem 4", "4")
  const digitMatch = trimmed.match(/(\d+)/);
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10);
    const suffixes: Record<number, string> = {
      1: '1st',
      2: '2nd',
      3: '3rd',
      4: '4th',
      5: '5th',
      6: '6th',
      7: '7th',
      8: '8th',
    };
    if (suffixes[num]) {
      return `${suffixes[num]} Semester`;
    }
  }

  return trimmed;
}
