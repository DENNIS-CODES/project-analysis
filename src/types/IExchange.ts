export enum OrderSide {
    Buy = 'buy',
    Sell = 'sell',
  }
  
  export enum OrderType {
    Market = 'market',
    Limit = 'limit',
  }
  
  export interface Order {
    id: number;
    market: string;
    side: string;
    type: string;
    price: number;
    quantity: number;
    status?: string;
    filled?: number;
    remaining?: number;
    createdAt: Date;
    clientId?: string | null;
  }