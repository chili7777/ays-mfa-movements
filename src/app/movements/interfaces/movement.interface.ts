export interface Movement {
  id: string;
  accountId: string;
  movementType: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  balance?: number;
  movementDate: string;
  description?: string;
}
