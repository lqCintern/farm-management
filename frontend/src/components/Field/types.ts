export interface Field {
    id: string;
    name: string;
    location: string;
    description?: string;
    area: number;
    coordinates: { lat: number; lng: number }[];
    color: string;
    created_at: string;
  }