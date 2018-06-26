const ZeroExWrapper = artifacts.require("ZeroExWrapper");
const TokenTransferProxy = artifacts.require("TokenTransferProxy");
const Exchange = artifacts.require("Exchange");
const WETH = artifacts.require("MockWETH");
import { ZeroEx } from "0x.js";
import { BigNumber } from "@0xproject/utils";

export const deployZeroEx = async web3 => {
    const tokenTransferProxy = await TokenTransferProxy.new();
    const exchange = await Exchange.new(ZeroEx.NULL_ADDRESS, tokenTransferProxy.address);
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

export const createSignedOrder = async (web3, orderData) => {
    const trade = await createZeroExOrder(
        orderData.exchange,
        orderData.maker,
        orderData.makerToken,
        orderData.takerToken,
        orderData.makerAmount,
        orderData.takerAmount
    );
    const signedOrder = await signOrder(web3, trade, orderData.maker);
    const orderAddresses = getAddresses(signedOrder);
    const orderValues = getValues(signedOrder);
    return {
        orderAddresses: orderAddresses,
        orderValues: orderValues,
        ecSignature: signedOrder.ecSignature
    };
};

export const zeroExTokenOrderData = async (zeroEx, wrapper, orderData) => {
    const signedOrder = await createSignedOrder(zeroEx, orderData);
    const sig = signedOrder.ecSignature;
    return wrapper.methods
        .getTokens(signedOrder.orderAddresses, signedOrder.orderValues, sig.v, sig.r, sig.s)
        .encodeABI();
};

export const zeroExEtherOrderData = async (zeroEx, wrapper, orderData) => {
    const signedOrder = await createSignedOrder(zeroEx, orderData);
    const sig = signedOrder.ecSignature;
    return wrapper.methods
        .getEther(signedOrder.orderAddresses, signedOrder.orderValues, sig.v, sig.r, sig.s)
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

export const getAddresses = order => {
    return [
        order.maker,
        order.taker,
        order.makerTokenAddress,
        order.takerTokenAddress,
        order.feeRecipient
    ];
};

export const getValues = order => {
    return [
        order.makerTokenAmount,
        order.takerTokenAmount,
        order.makerFee,
        order.takerFee,
        order.expirationUnixTimestampSec,
        order.salt
    ];
};