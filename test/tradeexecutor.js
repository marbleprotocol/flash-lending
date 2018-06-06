const TradeExecutor = artifacts.require("TradeExecutor");
const ZeroExWrapper = artifacts.require("ZeroExWrapper");
const BancorWrapper = artifacts.require("BancorWrapper");
const KyberWrapper = artifacts.require("KyberWrapper");
const MockToken = artifacts.require("MockToken");
const MockWETH = artifacts.require("MockWETH");
const Web3 = require("web3");
const web3Wrapper = new Web3(web3.currentProvider);
import { zeroExTokenOrderData, zeroExEtherOrderData } from "./helpers/ZeroExUtils";
import { deployBancor } from "./helpers/BancorUtils";
import { deployZeroEx } from "./helpers/ZeroExUtils";

contract("TradeExecutor", accounts => {
    let tradeExecutor;
    let bancorWrapper;
    let kyberWrapper;
    let zeroExWrapper;
    let weth;

    // Accounts
    const trader = accounts[1];

    // Bancor trades
    let smartToken1;
    let smartToken1QuickBuyPath;
    let smartToken1QuickSellPath;

    // 0x trades
    const address = "0x0000000000000000000000000000000000000000";
    const value = 0;
    const TOKEN_AMOUNT = 1000;
    const ETH_AMOUNT = 400;
    const signature = {
        v: 27,
        r: "0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33",
        s: "0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254"
    };

    beforeEach(async () => {
        tradeExecutor = await TradeExecutor.new();
        ({
            bancorWrapper,
            smartToken1,
            smartToken1QuickBuyPath,
            smartToken1QuickSellPath
        } = await deployBancor(accounts));
        ({ zeroExWrapper } = await deployZeroEx(web3Wrapper));
    });

    it("should trade Bancor", async () => {
        const bancor = new web3Wrapper.eth.Contract(bancorWrapper.abi, bancorWrapper.address);
        const trade1 = bancor.methods.getTokens(smartToken1QuickBuyPath, 1).encodeABI();
        const trade2 = bancor.methods.getEther(smartToken1QuickSellPath, 1).encodeABI();

        await tradeExecutor.trade(
            [bancorWrapper.address, bancorWrapper.address],
            smartToken1.address,
            trade1,
            trade2,
            { from: trader, value: 10000 }
        );

        // await bancorWrapper.getTokens(smartToken1QuickBuyPath, 1, {
        //     from: trader,
        //     value: 10000
        // });

        // // Initialize the mock exchange with some maker tokens
        // const tokenA = await MockToken.new([zeroEx.address], [TOKEN_AMOUNT]);
        // // Token A is the maker token. WETH is the taker token
        // const trade = {
        //     orderAddresses: [address, address, tokenA.address, weth.address, address],
        //     orderValues: [TOKEN_AMOUNT, value, value, value, value, value],
        //     v: signature.v,
        //     r: signature.r,
        //     s: signature.s
        // };
        // const tradeData = zeroExTokenOrderData(trade);
        // const zeroExWrapperAddr = zeroExWrapper._address;
        // await tradeExecutor.execute(zeroExWrapperAddr, tradeData, { value: ETH_AMOUNT });
        // const tokenBalance = await tokenA.balanceOf(tradeExecutor.address);
        // // The trade executor should receive tokens
        // expect(Number(tokenBalance)).to.equal(TOKEN_AMOUNT);
        // const wethBalance = await weth.balanceOf(zeroEx.address);
        // // The maker should receive wrapped Ether
        // expect(Number(wethBalance)).to.equal(ETH_AMOUNT);
    });

    // it("should trade tokens for Ether", async () => {
    //     // Iniitialize the wrapper with tokens
    //     const zeroExWrapperAddr = zeroExWrapper._address;
    //     const tokenA = await MockToken.new([zeroExWrapperAddr], [TOKEN_AMOUNT]);

    //     // Create some wrapped Ether and send it to the exchange so that it can complete the trade
    //     await weth.deposit({ from: accounts[1], value: ETH_AMOUNT });

    //     const wethBalance = await weth.balanceOf(accounts[1]);
    //     expect(Number(wethBalance)).to.equal(ETH_AMOUNT);

    //     await weth.transfer(zeroEx.address, ETH_AMOUNT, { from: accounts[1] });

    //     const trade = {
    //         orderAddresses: [address, address, weth.address, tokenA.address, address],
    //         orderValues: [ETH_AMOUNT, value, value, value, value, value],
    //         fillTakerTokenAmount: TOKEN_AMOUNT,
    //         shouldThrowOnInsufficientBalanceOrAllowance: true,
    //         v: signature.v,
    //         r: signature.r,
    //         s: signature.s
    //     };

    //     const tradeData = zeroExEtherOrderData(trade);

    //     await tradeExecutor.execute(zeroExWrapperAddr, tradeData);

    //     const ethBalance = await web3Wrapper.eth.getBalance(tradeExecutor.address);
    //     expect(Number(ethBalance)).to.equal(ETH_AMOUNT);

    //     const tokenBalance = await tokenA.balanceOf(zeroEx.address);
    //     expect(Number(tokenBalance)).to.equal(TOKEN_AMOUNT);
    // });

    // it("should make two trades atomically", async () => {
    //     // Initialize the mock exchange with some maker tokens
    //     const tokenA = await MockToken.new([zeroEx.address], [TOKEN_AMOUNT]);
    //     const zeroExWrapperAddr = zeroExWrapper._address;

    //     const tokenTrade = {
    //         orderAddresses: [address, address, tokenA.address, weth.address, address],
    //         orderValues: [TOKEN_AMOUNT, value, value, value, value, value],
    //         fillTakerTokenAmount: ETH_AMOUNT,
    //         shouldThrowOnInsufficientBalanceOrAllowance: true,
    //         v: signature.v,
    //         r: signature.r,
    //         s: signature.s
    //     };

    //     const tokenTradeData = zeroExTokenTradeData(tokenTrade);

    //     const etherTrade = {
    //         orderAddresses: [address, address, weth.address, tokenA.address, address],
    //         orderValues: [ETH_AMOUNT, value, value, value, value, value],
    //         fillTakerTokenAmount: 0, // Let the smart contract decide based on proceeds of the first trade
    //         shouldThrowOnInsufficientBalanceOrAllowance: true,
    //         v: signature.v,
    //         r: signature.r,
    //         s: signature.s
    //     };

    //     const etherTradeData = zeroExEtherTradeData(etherTrade);

    //     await tradeExecutor.trade(
    //         [zeroExWrapperAddr, zeroExWrapperAddr],
    //         tokenA.address,
    //         tokenTradeData,
    //         etherTradeData,
    //         { value: ETH_AMOUNT }
    //     );
    // });
});