export interface Location {
  id: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  addedAt: Date;
}