import { CancelAllOrdersReq, HistoricalIndexReq, RestClient } from "ftx-api";
import { sleep } from "../utils";
import { configs } from "../config/config";
import { Order, OrderType } from "../types";
import { sendMessage } from "./telegram";
import { GenericAPIResponse } from "ftx-api/lib/util/requestUtils";
import { resourceLimits } from "worker_threads";

/**
 * FTX exchange Implementation.
 * @class
 * @extends Exchange
 */

export class FTXExchange {
  client: RestClient;
  constructor(key: string, secret: string, subAccountName: string) {
    this.client = new RestClient(key, secret, {
      subAccountName,
    });
  }

  /**
   * Get symbol market price.
   * @param symbol Asset name.
   * @returns Promise<number>
   * @memberof FTX
   * @method
   * @async
   * @example
   * await ftx.getPrice('BTC/USDT');
   * @example
   * await ftx.getPrice('ETH/USDT');
   * @example
   * await ftx.getPrice('LTC/USDT');
   */

  getPrice = async (symbol: string): Promise<number | null> => {
    symbol = this.getMarket(symbol);
    const { success, result } = await this.client.getFuture(symbol);
    if (success) {
      return result.last;
    }
    return null;
  };

  /*
   * Get All active orders.
   * @returns Promise<Order[]>
   * @memberof FTX
   * @method
   * @async
   * @example
   * await ftx.getOrders();
   */

  getActiveOrders = async (): Promise<Order[]> => {
    let { success, result } = await this.client.getOpenOrders();
    if (success) {
      let orders = result.map((order: any) => {
        return {
          id: order.id,
          market: order.market,
          side: order.side,
          type: order.type,
          price: order.price,
          quantity: order.size,
          status: order.status,
          filled: order.filledSize,
          remaining: order.remainingSize,
          createdAt: order.createdAt,
          clientId: order.clientId,
        };
      });

      return orders;
    }

    return [];
  };

  /**
   * Place an order.
   * @param _params.symbol Asset name.
   * @param _params.side Order side.
   * @param _params.type Order type.
   * @param _params.price Order price.
   * @param _params.quantity Order quantity.
   * @returns Promise<Order>
   * @memberof FTX
   * @method
   * @async
   * @example
   * await ftx.placeOrder({
   *  symbol: 'BTC/USDT',
   * side: OrderSide.Buy,
   * type: OrderType.Limit,
   * price: 0.000001,
   * quantity: 1,
   * });
   */

  placeOrder = async (_params: {
    market: string;
    side: "buy" | "sell";
    type: OrderType;
    price: number;
    size: number;
  }): Promise<Order | null> => {
    let _future: any = await this.client.getFuture(_params.market);
    let future: any = _future?.result;
    _params.market = this.getMarket(_params.market);
    _params.size = _params.size / parseFloat(`${future?.last}`);
    const { success, result } = await this.client.placeOrder(_params);

    if (success) {
      return {
        id: result.id,
        market: result.market,
        side: result.side,
        type: result.type,
        price: result.price,
        quantity: result.size,
        createdAt: result.createdAt,
      };
    }
    return null;
  };
  /**
   *  Place a conditional order.
   * @param _params.symbol Asset name.
   * @param _params.side Order side.
   * @param _params.type Order type.
   * @param _params.price Order price.
   * @param _params.quantity Order quantity.
   */
  placeConditionalOrder = async (_params: {
    market: string;
    side: "buy" | "sell";
    type: any;
    price: number;
    size: number;
  }): Promise<Order | null> => {
    _params.market = this.getMarket(_params.market);

    const { success, result } = await this.client.placeTriggerOrder(_params);

    if (success) {
      return {
        id: result.id,
        market: result.market,
        side: result.side,
        type: result.type,
        price: result.price,
        quantity: result.size,
        createdAt: result.createdAt,
      };
    }
    return null;
  };

  /**
   * Chase an order.
   * @param _params.id Order id.
   * @returns Promise<Order>
   */

  chaseOrder = async (
    _params: {
      id: string;
      market: string;
      side: "buy" | "sell";
      trailByBPS?: number;
      maxRetries?: number;
    },
    _extraParams?: {
      tgId?: number;
    }
  ): Promise<void> => {
    let count = 0;
    _params.market = this.getMarket(_params.market);

    let { id, market, side, trailByBPS, maxRetries } = _params;
    let { tgId } = _extraParams || {};

    const MAX_RETRIES = maxRetries ?? configs.MAX_RETRIES;
    while (true) {
      let msg = `Chasing order ${id}`;
      console.info(msg);

      let price = await this.getPrice(market);
      if (price === null) {
        msg = `Could not get price for ${market}`;
        tgId && sendMessage(msg);
        console.error(msg);
        return;
      }

      // trailByBPS is the value to trail by in percent
      trailByBPS = trailByBPS ?? 0.01;
      price =
        side === "buy"
          ? (price * (100 - trailByBPS)) / 100
          : (price * (100 + trailByBPS)) / 100;

      try {
        const { success, result, error } = await this.client.modifyOrder({
          orderId: id.toString(),
          price,
        });
        if (success) {
          id = result.id;
          market = result.market;
          side = result.side;
          continue;
        } else {
          console.error(`Could not chase order ${id}`, error);
        }
      } catch (error: any) {
        let rsn = error?.body?.error;
        console.log("Error:", rsn);
        if (rsn?.includes("Must modify either price or size")) {
          continue;
        }
        if (rsn?.includes("Size too small for provide")) {
          msg = `Order is now in position ✔️`;
          tgId && sendMessage(msg);

          break;
        }
      }

      count++;
      if (count > MAX_RETRIES) {
        msg = `Max retries\\/chases reached for order ${id}. Chased order ${count} times.`;
        tgId && sendMessage(msg);
        break;
      }

      // Wait for a bit before trying again
      await sleep(1000);
    }
  };

  /**
   * Cancel an order.
   * @param _params.orderId Order id.
   * @returns Promise<boolean>
   */
  cancelOrder = async (_params: { orderId: string }): Promise<boolean> => {
    const { success, result } = await this.client.cancelOrder(_params.orderId);

    console.info(result);
    return success;
  };

  /**
   * Cancel All orders.
   * @returns Promise<boolean>
   */
  cancelAllOrders = async (_params: CancelAllOrdersReq): Promise<boolean> => {
    let { success, result } = await this.client.cancelAllOrders(_params);

    console.info(result);

    return success;
  };
  /**
   * Get Positions
   * @returns Promise<Order>
   * @memberof FTX
   * @method
   * @async
   * @example
   * await ftx.getPositions();
   */
  getExpiredFutures = async (_params: {
    marketName: string;
    startTime: number;
    endTime: number;
    resolution: number;
  }): Promise<void> => {
    const { success, result } = await this.client.getHistoricalIndex(_params);

    if (success) {
      return result;
    }
    return;
  };

  getPositions = async (): Promise<{
    result: {
      market: string;
      size: number;
      side: string;
      openSize: number;
    }[];
    success: boolean;
    ret_msg?: string;
  }> => {
    let { result, success } = await this.client.getPositions();
    if (success) {
      return {
        result: result
          .filter((position) => position.openSize > 0)
          .map((position) => {
            return {
              market: position.future,
              size: position.size,
              side: position.side,
              openSize: position.openSize,
            };
          }),
        success,
      };
    }
    return {
      success,
      result: [],
    };
  };

  /**
   * Get Account Balance
   */
  getBalance = async (_params: { symbol: string }): Promise<number> => {
    let { result: balances, success } = await this.client.getBalances();

    if (success) {
      let balance = balances.find((b) => b.coin === _params.symbol);
      return Number(balance?.availableWithoutBorrow ?? 0);
    }

    throw new Error("Could not get balance");
  };

  /**
   * Get Market
   * @returns string
   */
  getMarket = (symbol: string) => {
    symbol = symbol.toUpperCase();
    if (symbol.endsWith("-PERP")) {
    } else if (symbol.endsWith("PERP")) {
      symbol = symbol.replace("PERP", "-PERP");
    } else if (symbol.endsWith("-USDT")) {
      symbol = symbol.replace("-USDT", "-PERP");
    } else if (symbol.endsWith("USDT")) {
      symbol = symbol.replace("USDT", "-PERP");
    }
    return symbol;
  };

  getHistoricalData = async (params: {
    marketName: string;
    startTime: number;
    endTime: number;
    resolution: number;
  }): Promise<{
    result: {
      close: number;
      high: number;
      low: number;
      open: number;
      volume: number;
      starttime: string;
    }[];
    success: boolean;
  }> => {
    const { result, success } = await this.client.getHistoricalIndex(params);
    if (success) {
      console.log("result", result);
       result.map((result: any) => {
          return {
            close: result?.close,
            high: result?.high,
            low: result.low,
            open: result.open,
            volume: result.volume,
            starttime: result.starttime,
          };          
        });
        return { result: [], success: true };
    }
    return { result: [], success: false };``

  };
}
