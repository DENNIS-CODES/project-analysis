"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SharedEndpoints {
    /**
     *
     * Market Data Endpoints
     *
     */
    getOrderBook(params) {
        return this.requestWrapper.get('v2/public/orderBook/L2', params);
    }
    /**
     * Get latest information for symbol
     */
    getTickers(params) {
        return this.requestWrapper.get('v2/public/tickers', params);
    }
    getSymbols() {
        return this.requestWrapper.get('v2/public/symbols');
    }
    /**
     * Get liquidated orders
     */
    getLiquidations(params) {
        return this.requestWrapper.get('v2/public/liq-records', params);
    }
    /**
     *
     * Market Data : Advanced
     *
     */
    getOpenInterest(params) {
        return this.requestWrapper.get('v2/public/open-interest', params);
    }
    getLatestBigDeal(params) {
        return this.requestWrapper.get('v2/public/big-deal', params);
    }
    getLongShortRatio(params) {
        return this.requestWrapper.get('v2/public/account-ratio', params);
    }
    /**
     *
     * Account Data Endpoints
     *
     */
    getApiKeyInfo() {
        return this.requestWrapper.get('v2/private/account/api-key');
    }
    /**
     *
     * Wallet Data Endpoints
     *
     */
    getWalletBalance(params) {
        return this.requestWrapper.get('v2/private/wallet/balance', params);
    }
    getWalletFundRecords(params) {
        return this.requestWrapper.get('v2/private/wallet/fund/records', params);
    }
    getWithdrawRecords(params) {
        return this.requestWrapper.get('v2/private/wallet/withdraw/list', params);
    }
    getAssetExchangeRecords(params) {
        return this.requestWrapper.get('v2/private/exchange-order/list', params);
    }
}
exports.default = SharedEndpoints;
//# sourceMappingURL=shared-endpoints.js.map