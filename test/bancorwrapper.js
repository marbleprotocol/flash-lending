import Web3 from "web3";
import BigNumber from "bignumber.js";
import { deployBancor } from "./helpers/BancorUtils";

const web3Beta = new Web3(web3.currentProvider);

let etherToken,
    smartToken1,
    smartToken2,
    smartToken3,
    smartToken4,
    erc20Token,
    converterExtensionsAddress,
    converter1,
    converter2,
    converter3,
    converter4,
    quickConverter,
    smartToken1QuickBuyPath,
    smartToken2QuickBuyPath,
    smartToken3QuickBuyPath,
    smartToken4QuickBuyPath,
    erc20QuickBuyPath,
    smartToken1QuickSellPath,
    smartToken2QuickSellPath,
    bancorWrapper;

contract("BancorWrapper", accounts => {
    const trader = accounts[1];

    before(async () => {
        ({
            etherToken,
            smartToken1,
            smartToken2,
            smartToken3,
            smartToken4,
            erc20Token,
            converterExtensionsAddress,
            converter1,
            converter2,
            converter3,
            converter4,
            quickConverter,
            smartToken1QuickBuyPath,
            smartToken2QuickBuyPath,
            smartToken3QuickBuyPath,
            smartToken4QuickBuyPath,
            erc20QuickBuyPath,
            smartToken1QuickSellPath,
            smartToken2QuickSellPath,
            bancorWrapper
        } = await deployBancor(accounts));
    });

    it("converts Ether to tokens", async () => {
        const prevBalance = await smartToken1.balanceOf(trader);
        await bancorWrapper.getTokens(converter1.address, smartToken1QuickBuyPath, 1, {
            from: trader,
            value: 10000
        });
        const newBalance = await smartToken1.balanceOf(trader);
        expect(BigNumber(newBalance).gt(prevBalance)).to.equal(true);
    });

    it("converts tokens to Ether", async () => {
        const tokenBalance = await smartToken1.balanceOf(trader);
        await smartToken1.transfer(bancorWrapper.address, tokenBalance, {
            from: trader
        });
        const prevBalance = await web3Beta.eth.getBalance(trader);
        const result = await bancorWrapper.getEther(converter1.address, smartToken1QuickSellPath, 1, { from: trader });
        const transaction = await web3Beta.eth.getTransaction(result.tx);
        const transactionCost = BigNumber(transaction.gasPrice).times(BigNumber(result.receipt.cumulativeGasUsed));
        const newBalance = await web3Beta.eth.getBalance(trader);
        expect(BigNumber(newBalance).gt(BigNumber(prevBalance).minus(transactionCost))).to.equal(true);
    });
});