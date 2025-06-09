export interface FormValues {
  title: string;
  product_type: string;
  description?: string;
  quantity: number | null;
  average_size?: number | null; // Keep for backward compatibility
  min_size?: number;
  max_size?: number;
  total_weight?: number | null;
  price_expectation: number | null;
  province?: string;
  district?: string;
  ward?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  coordinates?: Array<{lat: number, lng: number}>;
  fieldName?: string;
  locationNote?: string;
  harvest_start_date: string | null;
  harvest_end_date: string | null;
  crop_animal_id?: number | null;
  status: number;
  pineapple_crop?: {
    field_id?: string;
    variety?: string;
    current_stage?: string;
  };
  google_maps_url?: string;
}

export interface SectionProps {
  formValues: FormValues;
  setFormValues: (values: FormValues) => void;
  errors: Record<string, string>;
}