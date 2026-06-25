export interface TicketTier {
  key: string;
  name: string;
  label: string;
  price: number;
  seats: number;
  badge: string | null;
  displayOrder: number;
}
