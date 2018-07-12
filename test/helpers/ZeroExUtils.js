const ZeroExWrapper = artifacts.require("ZeroExWrapper");
const TokenTransferProxy = artifacts.require("TokenTransferProxy");
const Exchange = artifacts.require("Exchange");
const WETH = artifacts.require("MockWETH");
import { ZeroEx } from "0x.js";
import { BigNumber } from "@0xproject/utils";

export class ZeroExUtils {
    constructor(web3) {
        this.web3 = web3;
    }

    async init() {
        this.tokenTransferProxy = await TokenTransferProxy.new();
        this.exchange = await Exchange.new(ZeroEx.NULL_ADDRESS, this.tokenTransferProxy.address);
        // Add the exchange as an authorized address on the transfer proxy
        await this.tokenTransferProxy.addAuthorizedAddress(this.exchange.address);
        this.weth = await WETH.new();
        this.zeroExWrapper = await ZeroExWrapper.new(
            this.exchange.address,
            this.weth.address,
            this.tokenTransferProxy.address
        );
        this.zeroExWrapperContract = new this.web3.eth.Contract(
            ZeroExWrapper.abi,
            this.zeroExWrapper.address
        );
        const networkId = await this.web3.eth.net.getId();
        this.zeroEx = new ZeroEx(this.web3.currentProvider, { networkId: Number(networkId) });
    }

    async createZeroExOrder(exchange, maker, makerToken, takerToken, makerAmount, takerAmount) {
        const order = {
            maker: maker,
            taker: ZeroEx.NULL_ADDRESS,
            feeRecipient: ZeroEx.NULL_ADDRESS,
            makerTokenAddress: makerToken,
            takerTokenAddress: takerToken,
            exchangeContractAddress: exchange,
            salt: ZeroEx.generatePseudoRandomSalt(),
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerTokenAmount: makerAmount,
            takerTokenAmount: takerAmount,
            expirationUnixTimestampSec: "1546300800" // 1/1/19
        };
        return order;
    }

    async createSignedOrder(order) {
        const trade = await this.createZeroExOrder(
            order.exchange,
            order.maker,
            order.makerToken,
            order.takerToken,
            order.makerAmount,
            order.takerAmount
        );
        const signedOrder = await this.signOrder(trade, order.maker);
        const orderAddresses = this.getAddresses(signedOrder);
        const orderValues = this.getValues(signedOrder);
        return {
            orderAddresses: orderAddresses,
            orderValues: orderValues,
            ecSignature: signedOrder.ecSignature
        };
    }

    async getTokensOrderData(order) {
        const signedOrder = await this.createSignedOrder(order);
        const sig = signedOrder.ecSignature;
        return this.zeroExWrapperContract.methods
            .getTokens(signedOrder.orderAddresses, signedOrder.orderValues, sig.v, sig.r, sig.s)
            .encodeABI();
    }

    async getEtherOrderData(order) {
        const signedOrder = await this.createSignedOrder(order);
        const sig = signedOrder.ecSignature;
        return this.zeroExWrapperContract.methods
            .getEther(signedOrder.orderAddresses, signedOrder.orderValues, sig.v, sig.r, sig.s)
            .encodeABI();
    }

    async signOrder(order, maker) {
        const orderHash = ZeroEx.getOrderHashHex(order);
        const ecSignature = await this.zeroEx.signOrderHashAsync(orderHash, maker);
        const signedOrder = {
            ...order,
            ecSignature
        };
        return signedOrder;
    }

    getAddresses(order) {
        return [
            order.maker,
            order.taker,
            order.makerTokenAddress,
            order.takerTokenAddress,
            order.feeRecipient
        ];
    }

    getValues(order) {
        return [
            order.makerTokenAmount,
            order.takerTokenAmount,
            order.makerFee,
            order.takerFee,
            order.expirationUnixTimestampSec,
            order.salt
        ];
    }
}
