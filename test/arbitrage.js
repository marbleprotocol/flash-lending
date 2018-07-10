const TradeExecutor = artifacts.require("TradeExecutor");
const Bank = artifacts.require("Bank");
const FlashLender = artifacts.require("FlashLender");
const Arbitrage = artifacts.require("Arbitrage");
const MockToken = artifacts.require("MockToken");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const Web3 = require("web3");
const web3Beta = new Web3(web3.currentProvider);

import {
    zeroExTokenOrderData,
    zeroExEtherOrderData
} from "./helpers/ZeroExUtils";
import { getTxCost } from "./helpers/utils";
import { deployZeroEx } from "./helpers/ZeroExUtils";
import { MAX_UINT } from "./helpers/constants";
import BigNumber from "bignumber.js";

contract("Arbitrage", accounts => {
    // Contracts
    let bank;
    let flashLender;
    let arbitrage;
    let token;
    let tradeExecutor;

    // 0x
    let zeroExWrapper;
    let zeroExWrapperContract; // web3 version of wrapper (not truffle-contract)
    let zeroEx;
    let weth;
    let exchange;
    let tokenTransferProxy;

    // Accounts
    const trader = accounts[1];
    const maker = accounts[2];
    const lender = accounts[3];
    const dest = accounts[4];

    // Constants
    const DEPOSIT_AMOUNT = 10000;
    const ETH = "0x0000000000000000000000000000000000000000";

    const FEE = 10 ** 15; // .1% fee (10 ** 15 / 10*18)
    const ARB_PROFIT = 2000;
    const TRADE_AMOUNT = 10000;

    beforeEach(async () => {
        const traderETHBefore = await web3Beta.eth.getBalance(trader);
        tradeExecutor = await TradeExecutor.new();
        bank = await Bank.new({ from: lender }); // lender is owner of the bank
        flashLender = await FlashLender.new(bank.address, FEE);
        arbitrage = await Arbitrage.new(
            flashLender.address,
            tradeExecutor.address
        );

        ({
            zeroExWrapper,
            exchange,
            weth,
            tokenTransferProxy,
            zeroEx
        } = await deployZeroEx(web3Beta));

        // Approve the FlashLender contract as a bank borrower
        await bank.addBorrower(flashLender.address, { from: lender });

        // Lender deposits Ether into the bank
        await bank.deposit(ETH, DEPOSIT_AMOUNT, {
            from: lender,
            value: DEPOSIT_AMOUNT
        });

        await weth.deposit({
            from: maker,
            value: TRADE_AMOUNT
        });

        token = await MockToken.new([maker], [TRADE_AMOUNT]);

        // Approve the proxy to transfer tokens on behalf of the maker
        await weth.approve(tokenTransferProxy.address, MAX_UINT, {
            from: maker
        });

        await token.approve(tokenTransferProxy.address, MAX_UINT, {
            from: maker
        });

        zeroExWrapperContract = new web3Beta.eth.Contract(
            zeroExWrapper.abi,
            zeroExWrapper.address
        );
    });

    // Calldata to give to Arbitrage.
    // This will be used in the executeArbitrage callback from FlashLender.
    const tradeExecutorData = async () => {
        const tradeData1 = {
            exchange: exchange.address,
            maker: maker,
            makerToken: token.address,
            takerToken: weth.address,
            makerAmount: `${TRADE_AMOUNT}`,
            takerAmount: `${TRADE_AMOUNT - ARB_PROFIT}`
        };
        const trade1 = await zeroExTokenOrderData(
            zeroEx,
            zeroExWrapperContract,
            tradeData1
        );
        const tradeData2 = {
            exchange: exchange.address,
            maker: maker,
            makerToken: weth.address,
            takerToken: token.address,
            makerAmount: `${TRADE_AMOUNT}`,
            takerAmount: `${TRADE_AMOUNT}`
        };
        const trade2 = await zeroExEtherOrderData(
            zeroEx,
            zeroExWrapperContract,
            tradeData2
        );
        const wrappers = [zeroExWrapper.address, zeroExWrapper.address];
        const executor = new web3Beta.eth.Contract(
            tradeExecutor.abi,
            tradeExecutor.address
        );
        const data = executor.methods
            .trade(wrappers, token.address, trade1, trade2)
            .encodeABI();
        return data;
    };

    it("flash lender should have the correct fee", async () => {
        const fee = await flashLender.fee();
        expect(fee.toNumber()).to.equal(FEE);
    });

    it("should calculate the repay amount correctly", async () => {
        const repayAmount = await arbitrage.getRepayAmount(1000);
        expect(repayAmount.toNumber()).to.equal(1001);
    });

    it("should execute an arbitrage trade with two 0x orders", async () => {
        const bankETHBefore = await web3Beta.eth.getBalance(bank.address);
        const destETHBefore = await web3Beta.eth.getBalance(dest);
        const makerWETHBefore = await weth.balanceOf(maker);

        const data = await tradeExecutorData();
        await arbitrage.submitTrade(ETH, TRADE_AMOUNT, dest, data, {
            from: trader
        });

        const feeAmount = FEE * TRADE_AMOUNT / 10 ** 18;
        const destETHAfter = await web3Beta.eth.getBalance(dest);

        expect(destETHAfter.toString()).to.equal(
            BigNumber(destETHBefore)
                .plus(BigNumber(ARB_PROFIT))
                .minus(feeAmount)
                .toString()
        );
        const makerWETHAfter = await weth.balanceOf(maker);
        expect(makerWETHAfter.toString()).to.equal(
            makerWETHBefore.minus(ARB_PROFIT).toString()
        );
        const bankETHAfter = await web3Beta.eth.getBalance(bank.address);
        expect(bankETHAfter).to.equal(
            BigNumber(bankETHBefore)
                .plus(feeAmount)
                .toString()
        );
    });

    it("should execute an arbitrage trade with 0x and Bancor", async () => {
        // TODO:
    });

    it("should execute an arbitrage trade with two EtherDelta orders", async () => {
        // TODO:
    });
});