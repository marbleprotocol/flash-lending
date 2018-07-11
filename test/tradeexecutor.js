const TradeExecutor = artifacts.require("TradeExecutor");
const ZeroExWrapper = artifacts.require("ZeroExWrapper");
const BancorWrapper = artifacts.require("BancorWrapper");
const KyberWrapper = artifacts.require("KyberWrapper");
const MockToken = artifacts.require("MockToken");
const MockWETH = artifacts.require("MockWETH");
const Web3 = require("web3");
const web3Beta = new Web3(web3.currentProvider);
import { ZeroExUtils } from "./helpers/ZeroExUtils";
import { deployBancor } from "./helpers/BancorUtils";
import { MAX_UINT } from "./helpers/constants";
import { getTxCost } from "./helpers/utils";
import BigNumber from "bignumber.js";

contract("TradeExecutor", accounts => {
    let tradeExecutor;
    let bancorWrapper;
    let zeroExWrapper;

    // Bancor
    let converter1;
    let smartToken1;
    let smartToken1QuickBuyPath;
    let smartToken1QuickSellPath;

    // 0x
    let zeroExUtils;
    let zeroEx;
    let weth;
    let exchange;
    let tokenTransferProxy;

    // Accounts
    const trader = accounts[1];
    const maker = accounts[2];

    beforeEach(async () => {
        tradeExecutor = await TradeExecutor.new();
        ({
            bancorWrapper,
            converter1,
            smartToken1,
            smartToken1QuickBuyPath,
            smartToken1QuickSellPath
        } = await deployBancor(accounts));

        zeroExUtils = new ZeroExUtils(web3Beta);
        await zeroExUtils.init();
        ({ zeroExWrapper, zeroEx, exchange, weth, tokenTransferProxy } = zeroExUtils);
    });

    it("should trade Bancor", async () => {
        const bancor = new web3Beta.eth.Contract(bancorWrapper.abi, bancorWrapper.address);
        const trade1 = bancor.methods
            .getTokens(converter1.address, smartToken1QuickBuyPath, 1)
            .encodeABI();
        const trade2 = bancor.methods
            .getEther(converter1.address, smartToken1QuickSellPath, 1)
            .encodeABI();

        const prevBalance = await web3Beta.eth.getBalance(trader);

        const result = await tradeExecutor.trade(
            [bancorWrapper.address, bancorWrapper.address],
            smartToken1.address,
            trade1,
            trade2,
            { from: trader, value: 10000 }
        );

        const newBalance = await web3Beta.eth.getBalance(trader);
        const txCost = await getTxCost(web3Beta, result);

        // These should be pretty close, with differences due to Bancor formula margin of error
        // console.log(newBalance);
        // console.log(BigNumber(prevBalance).minus(txCost).toString());
    });

    it.only("should trade 0x", async () => {
        const tokenA = await MockToken.new([maker], [20000]);
        await weth.deposit({ from: maker, value: 30000 });

        // Approve the proxy to transfer tokens on behalf of the maker
        await weth.approve(tokenTransferProxy.address, MAX_UINT, { from: maker });
        await tokenA.approve(tokenTransferProxy.address, MAX_UINT, { from: maker });

        const order1 = {
            exchange: exchange.address,
            maker: maker,
            makerToken: tokenA.address,
            takerToken: weth.address,
            makerAmount: "1000",
            takerAmount: "800"
        };
        const trade1 = await zeroExUtils.orderData(order1);
        const order2 = {
            exchange: exchange.address,
            maker: maker,
            makerToken: weth.address,
            takerToken: tokenA.address,
            makerAmount: "1000",
            takerAmount: "1000"
        };
        const trade2 = await zeroExUtils.orderData(order2);

        const prevBalance = await web3Beta.eth.getBalance(trader);

        console.log(zeroExWrapper.address);
        console.log(tokenA.address);

        const result = await tradeExecutor.trade(
            [zeroExWrapper.address, zeroExWrapper.address],
            tokenA.address,
            trade1,
            trade2,
            { from: trader, value: 800 }
        );

        // const newBalance = await web3Beta.eth.getBalance(trader);
        // const txCost = await getTxCost(web3Beta, result);
        // expect(newBalance).to.equal(
        //     BigNumber(prevBalance)
        //         .minus(txCost)
        //         .plus(200)
        //         .toString()
        // );
    });
});
