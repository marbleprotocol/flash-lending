const ZeroExWrapper = artifacts.require("ZeroExWrapper");
const TokenTransferProxy = artifacts.require("TokenTransferProxy");
const Exchange = artifacts.require("Exchange");
const WETH = artifacts.require("MockWETH");
import { ZeroEx } from "0x.js";
import { BigNumber } from "@0xproject/utils";
import { NULL_ADDRESS } from "../../util/constants";

export const deployZeroEx = async web3 => {
    const tokenTransferProxy = await TokenTransferProxy.new();
    const exchange = await Exchange.new(NULL_ADDRESS, tokenTransferProxy.address);
    // Add the exchange as an authorized address on the transfer proxy
    await tokenTransferProxy.addAuthorizedAddress(exchange.address);
    const weth = await WETH.new();
    const zeroExWrapper = await ZeroExWrapper.new(
        exchange.address,
        weth.address,
        tokenTransferProxy.address
    );
    const networkId = await web3.eth.net.getId();
    const zeroEx = new ZeroEx(web3.currentProvider, { networkId: Number(networkId) });
    return {
        zeroExWrapper,
        exchange,
        tokenTransferProxy,
        weth,
        zeroEx
    };
};

export const zeroExTokenOrderData = (wrapper, order) => {
    return wrapper.methods
        .getTokens(order.orderAddresses, order.orderValues, order.v, order.r, order.s)
        .encodeABI();
};

export const zeroExEtherOrderData = (wrapper, order) => {
    return wrapper.methods
        .getEther(order.orderAddresses, order.orderValues, order.v, order.r, order.s)
        .encodeABI();
};

export const createZeroExOrder = async (
    exchange,
    maker,
    makerToken,
    takerToken,
    makerAmount,
    takerAmount
) => {
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
};

export const signOrder = async (zeroEx, order, maker) => {
    const orderHash = ZeroEx.getOrderHashHex(order);
    const ecSignature = await zeroEx.signOrderHashAsync(orderHash, maker);
    const signedOrder = {
        ...order,
        ecSignature
    };
    return signedOrder;
};

export const orderAddresses = order => {
    return [
        order.maker,
        order.taker,
        order.makerTokenAddress,
        order.takerTokenAddress,
        order.feeRecipient
    ];
};

export const orderValues = order => {
    return [
        order.makerTokenAmount,
        order.takerTokenAmount,
        order.makerFee,
        order.takerFee,
        order.expirationUnixTimestampSec,
        order.salt
    ];
};