import { deployBancor } from "./helpers/BancorUtils";

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
        await bancorWrapper.getTokens(
            converter1.address,
            smartToken1QuickBuyPath,
            1,
            {
                from: trader,
                value: 10000
            }
        );
        const newBalance = await smartToken1.balanceOf(trader);
        expect(newBalance.gt(prevBalance)).to.equal(true);
    });

    it("converts tokens to Ether", async () => {
        const tokenBalance = await smartToken1.balanceOf(trader);
        await smartToken1.transfer(bancorWrapper.address, tokenBalance, {
            from: trader
        });
        const prevBalance = await web3.eth.getBalance(trader);
        const result = await bancorWrapper.getEther(
            converter1.address,
            smartToken1QuickSellPath,
            1,
            { from: trader }
        );
        const transaction = web3.eth.getTransaction(result.tx);
        const transactionCost = transaction.gasPrice.times(
            result.receipt.cumulativeGasUsed
        );
        const newBalance = await web3.eth.getBalance(trader);
        expect(
            newBalance.gt(prevBalance.sub(transactionCost))
        ).to.equal(true);
    });
});