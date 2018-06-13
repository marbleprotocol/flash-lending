const TradeExecutor = artifacts.require("TradeExecutor");
const Bank = artifacts.require("Bank");
const Lend = artifacts.require("Lend");
const Arbitrage = artifacts.require("ArbitrageImpl");
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

contract("ArbitrageImpl", accounts => {
    // Contracts
    let bank;
    let lend;
    let arbitrage;
    let token;

    let tradeExecutor;

    // 0x
    let zeroExWrapper;
    let weth;
    let exchange;
    let tokenTransferProxy;

    // Accounts
    const trader = accounts[1];
    const maker = accounts[2];
    const lender = accounts[3];
    const dest = accounts[4];

    // Constants
    const DEPOSIT_AMOUNT = 100000;
    const ETH = "0x0000000000000000000000000000000000000000";
    const ARBITRAGE_AMOUNT = 50000;
    const MOCK_TOKEN_AMOUNT = 20000;

    const FEE = 10 ** 15; // .1% fee (10**15 / 10*18)
    const ARB_PROFIT = 1000;
    const TRADE_AMOUNT = "10000";
    const TRADE_AMOUNT_INT = parseInt(TRADE_AMOUNT);

    beforeEach(async () => {
        const traderETHBefore = await web3Beta.eth.getBalance(trader);
        tradeExecutor = await TradeExecutor.new();
        bank = await Bank.new();
        lend = await Lend.new(bank.address, FEE);
        arbitrage = await Arbitrage.new(lend.address, tradeExecutor.address);

        ({
            zeroExWrapper,
            exchange,
            weth,
            tokenTransferProxy
        } = await deployZeroEx(web3Beta));

        // Approve the Lend contract as a bank borrower
        await bank.addBorrower(lend.address);

        await bank.deposit(ETH, DEPOSIT_AMOUNT, {
            from: lender,
            value: DEPOSIT_AMOUNT
        });
        await weth.deposit({
            from: maker,
            value: TRADE_AMOUNT_INT + ARB_PROFIT
        });
    });

    const createOrderData = async () => {
        const tokenA = await MockToken.new([maker], [TRADE_AMOUNT_INT]);

        //Approve the proxy to transfer tokens on behalf of the maker
        await weth.approve(tokenTransferProxy.address, MAX_UINT, {
            from: maker
        });
        await tokenA.approve(tokenTransferProxy.address, MAX_UINT, {
            from: maker
        });

        const zeroEx = new web3Beta.eth.Contract(
            zeroExWrapper.abi,
            zeroExWrapper.address
        );

        const tradeData1 = {
            exchange: exchange.address,
            maker: maker,
            makerToken: tokenA.address,
            takerToken: weth.address,
            makerAmount: TRADE_AMOUNT,
            takerAmount: (TRADE_AMOUNT - ARB_PROFIT).toString()
        };
        const trade1 = await zeroExTokenOrderData(web3Beta, zeroEx, tradeData1);

        const tradeData2 = {
            exchange: exchange.address,
            maker: maker,
            makerToken: weth.address,
            takerToken: tokenA.address,
            makerAmount: TRADE_AMOUNT,
            takerAmount: TRADE_AMOUNT
        };
        const trade2 = await zeroExEtherOrderData(web3Beta, zeroEx, tradeData2);

        const wrappers = [zeroExWrapper.address, zeroExWrapper.address];

        const executor = new web3Beta.eth.Contract(
            tradeExecutor.abi,
            tradeExecutor.address
        );
        const data = executor.methods
            .trade(wrappers, tokenA.address, trade1, trade2)
            .encodeABI();
        return data;
    };

    it("should execute 0x bytes", async () => {
        const bankETHBefore = await web3Beta.eth.getBalance(bank.address);
        console.log("BANK ETH BEFORE: ", bankETHBefore);

        const makerWETHBefore = await weth.balanceOf(maker);
        console.log("MAKER WETH BEFORE: ", makerWETHBefore.toNumber());

        const destETHBefore = await web3Beta.eth.getBalance(dest);
        console.log("ARB TRADER ETH BEFORE: ", destETHBefore);

        const data = await createOrderData();
        const loanSize = TRADE_AMOUNT_INT;

        await arbitrage.borrow(ETH, dest, loanSize, data, { from: trader });

        const feeAmount = FEE * loanSize / 10 ** 18;
        console.log("LOAN SIZE:", loanSize);
        console.log("FEE AMOUNT:", feeAmount);

        const destETHAfter = await web3Beta.eth.getBalance(dest);
        console.log("ARB TRADER ETH AFTER: ", destETHAfter);
        expect(parseInt(destETHAfter)).to.equal(
            parseInt(destETHBefore) + ARB_PROFIT - feeAmount
        );

        const makerWETHAfter = await weth.balanceOf(maker);
        console.log("MAKER WETH AFTER: ", makerWETHAfter.toNumber());
        expect(makerWETHAfter.toNumber()).to.equal(
            makerWETHBefore.toNumber() - ARB_PROFIT
        );

        const bankETHAfter = await web3Beta.eth.getBalance(bank.address);
        console.log("BANK ETH AFTER: ", bankETHAfter);

        expect(parseInt(bankETHAfter)).to.equal(
            parseInt(bankETHBefore) + feeAmount
        );
    });
});