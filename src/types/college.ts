export interface EngineeringCollege {
  id: string;
  name: string;
  state: string;
  city: string;
  aishe_code: string;
  college_type: string;
  abbreviations?: string[];
  created_at?: string;
}

export interface CollegeSearchParams {
  query?: string;
  state?: string;
  limit?: number;
  offset?: number;
}
