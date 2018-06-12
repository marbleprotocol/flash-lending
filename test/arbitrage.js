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

import { zeroExTokenOrderData, zeroExEtherOrderData } from "./helpers/ZeroExUtils";
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

    // Constants
    const DEPOSIT_AMOUNT = 100000;
    const ETH = "0x0000000000000000000000000000000000000000";
    const ARBITRAGE_AMOUNT = 50000;
    const MOCK_TOKEN_AMOUNT = 20000;

    const FEE = 0 //10 ** 15; // 10**15 / 10*18 = .1% fee

    beforeEach(async () => {
        tradeExecutor = await TradeExecutor.new();
        bank = await Bank.new();
        lend = await Lend.new(bank.address, FEE);
        arbitrage = await Arbitrage.new(lend.address, tradeExecutor.address, { from: trader });

        ({ zeroExWrapper, exchange, weth, tokenTransferProxy } = await deployZeroEx(web3Beta));

        // Approve the Lend contract as a bank borrower
        await bank.addBorrower(lend.address);

        await bank.deposit(ETH, DEPOSIT_AMOUNT, {from: lender, value: DEPOSIT_AMOUNT});
    });

    it("should execute 0x bytes", async () => {

        const tokenA = await MockToken.new([maker], [20000]);
        await weth.deposit({ from: maker, value: 20000 });

        const bankETHBefore = await web3Beta.eth.getBalance(bank.address);
        console.log("BANK ETH BEFORE: ", bankETHBefore); 

        const balBefore = await weth.balanceOf(maker); 
        console.log("MAKER WETH BEFORE: ", balBefore.toNumber()); 

         const balBeforeTrader = await  web3Beta.eth.getBalance(arbitrage.address);
        console.log("ARB TRADER ETH BEFORE: ", balBeforeTrader); 

        //Approve the proxy to transfer tokens on behalf of the maker
        await weth.approve(tokenTransferProxy.address, MAX_UINT, { from: maker });
        await tokenA.approve(tokenTransferProxy.address, MAX_UINT, { from: maker });

        const zeroEx = new web3Beta.eth.Contract(zeroExWrapper.abi, zeroExWrapper.address);

        const tradeData1 = {
            exchange: exchange.address,
            maker: maker,
            makerToken: tokenA.address,
            takerToken: weth.address,
            makerAmount: "500",
            takerAmount: "400"
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

        const wrappers = [zeroExWrapper.address, zeroExWrapper.address]; 

        const executor = new web3Beta.eth.Contract(tradeExecutor.abi,tradeExecutor.address);
        const data = executor.methods.trade(wrappers, tokenA.address, trade1, trade2).encodeABI();

       await arbitrage.borrow(ETH, ARBITRAGE_AMOUNT, data, { from: trader });

       const balAfterTrader = await  web3Beta.eth.getBalance(arbitrage.address);
        console.log("ARB TRADER ETH AFTER: ", balAfterTrader); 

       const balAfter = await weth.balanceOf(maker); 
       console.log("MAKER WETH AFTER: ", balAfter.toNumber()); 

       const bankETHAfter = await web3Beta.eth.getBalance(bank.address);
       console.log("BANK ETH AFTER: ", bankETHAfter); 

    });

});
