import { GenericAPIResponse } from './util/requestUtils';
import RequestWrapper from './util/requestWrapper';
export default abstract class SharedEndpoints {
    protected requestWrapper: RequestWrapper;
    /**
     *
     * Market Data Endpoints
     *
     */
    getOrderBook(params: {
        symbol: string;
    }): GenericAPIResponse;
    /**
     * Get latest information for symbol
     */
    getTickers(params?: {
        symbol?: string;
    }): GenericAPIResponse;
    getSymbols(): GenericAPIResponse;
    /**
     * Get liquidated orders
     */
    getLiquidations(params: {
        symbol: string;
        from?: number;
        limit?: number;
        start_time?: number;
        end_time?: number;
    }): GenericAPIResponse;
    /**
     *
     * Market Data : Advanced
     *
     */
    getOpenInterest(params: {
        symbol: string;
        period: string;
        limit?: number;
    }): GenericAPIResponse;
    getLatestBigDeal(params: {
        symbol: string;
        limit?: number;
    }): GenericAPIResponse;
    getLongShortRatio(params: {
        symbol: string;
        period: string;
        limit?: number;
    }): GenericAPIResponse;
    /**
     *
     * Account Data Endpoints
     *
     */
    getApiKeyInfo(): GenericAPIResponse;
    /**
     *
     * Wallet Data Endpoints
     *
     */
    getWalletBalance(params: {
        coin?: string;
    }): GenericAPIResponse;
    getWalletFundRecords(params?: {
        start_date?: string;
        end_date?: string;
        currency?: string;
        coin?: string;
        wallet_fund_type?: string;
        page?: number;
        limit?: number;
    }): GenericAPIResponse;
    getWithdrawRecords(params: {
        start_date?: string;
        end_date?: string;
        coin?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): GenericAPIResponse;
    getAssetExchangeRecords(params?: {
        limit?: number;
        from?: number;
        direction?: string;
    }): GenericAPIResponse;
}
