const TradeExecutor = artifacts.require("TradeExecutor");
const ZeroExWrapper = artifacts.require("ZeroExWrapper");
const BancorWrapper = artifacts.require("BancorWrapper");
const KyberWrapper = artifacts.require("KyberWrapper");
const MockToken = artifacts.require("MockToken");
const MockWETH = artifacts.require("MockWETH");
const Web3 = require("web3");
const web3Beta = new Web3(web3.currentProvider);
import { zeroExTokenOrderData, zeroExEtherOrderData } from "./helpers/ZeroExUtils";
import { deployBancor } from "./helpers/BancorUtils";
import { deployZeroEx } from "./helpers/ZeroExUtils";
import { MAX_UINT } from "./helpers/constants";
import { transactionCost } from "./helpers/utils";
import BigNumber from "bignumber.js";

contract("TradeExecutor", accounts => {
    let tradeExecutor;
    let bancorWrapper;
    let zeroExWrapper;

    // 0x
    let weth;
    let exchange;
    let tokenTransferProxy;

    // Accounts
    const trader = accounts[1];
    const maker = accounts[2];

    // Bancor trades
    let smartToken1;
    let smartToken1QuickBuyPath;
    let smartToken1QuickSellPath;

    beforeEach(async () => {
        tradeExecutor = await TradeExecutor.new();
        ({
            bancorWrapper,
            smartToken1,
            smartToken1QuickBuyPath,
            smartToken1QuickSellPath
        } = await deployBancor(accounts));
        ({ zeroExWrapper, exchange, weth, tokenTransferProxy } = await deployZeroEx(web3Beta));
    });

    it("should trade Bancor", async () => {
        const bancor = new web3Beta.eth.Contract(bancorWrapper.abi, bancorWrapper.address);
        const trade1 = bancor.methods.getTokens(smartToken1QuickBuyPath, 1).encodeABI();
        const trade2 = bancor.methods.getEther(smartToken1QuickSellPath, 1).encodeABI();

        await tradeExecutor.trade(
            [bancorWrapper.address, bancorWrapper.address],
            smartToken1.address,
            trade1,
            trade2,
            { from: trader, value: 10000 }
        );

        // TODO: Check balances
    });

    it.only("should trade 0x", async () => {
        const tokenA = await MockToken.new([maker], [20000]);
        await weth.deposit({ from: maker, value: 30000 });

        // Approve the proxy to transfer tokens on behalf of the maker
        await weth.approve(tokenTransferProxy.address, MAX_UINT, { from: maker });
        await tokenA.approve(tokenTransferProxy.address, MAX_UINT, { from: maker });

        const zeroEx = new web3Beta.eth.Contract(zeroExWrapper.abi, zeroExWrapper.address);
        const tradeData1 = {
            exchange: exchange.address,
            maker: maker,
            makerToken: tokenA.address,
            takerToken: weth.address,
            makerAmount: "1000",
            takerAmount: "800"
        };
        const trade1 = await zeroExTokenOrderData(web3Beta, zeroEx, tradeData1);

        const tradeData2 = {
            exchange: exchange.address,
            maker: maker,
            makerToken: weth.address,
            takerToken: tokenA.address,
            makerAmount: "1000",
            takerAmount: "1000"
        };
        const trade2 = await zeroExEtherOrderData(web3Beta, zeroEx, tradeData2);

        const prevBalance = await web3Beta.eth.getBalance(trader);

        const result = await tradeExecutor.trade(
            [zeroExWrapper.address, zeroExWrapper.address],
            tokenA.address,
            trade1,
            trade2,
            { from: trader, value: 800 }
        );

        const newBalance = await web3Beta.eth.getBalance(trader);
        const txCost = await transactionCost(web3Beta, result);
        expect(newBalance).to.equal(BigNumber(prevBalance).minus(txCost).plus(200).toString());
    });
});