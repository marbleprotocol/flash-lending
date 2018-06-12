const Token = artifacts.require("MockToken");
import { ZeroEx } from "0x.js";
import {
    deployZeroEx,
    createZeroExOrder,
    orderValues,
    orderAddresses,
    signOrder
} from "./helpers/ZeroExUtils";

const Web3 = require("web3");
const web3Wrapper = new Web3(web3.currentProvider);

contract("ZeroExWrapper", accounts => {
    // Accounts
    const taker = accounts[0];
    const maker = accounts[1];

    let zeroExWrapper, exchange, tokenTransferProxy, weth, token, zeroEx;

    beforeEach(async () => {
        ({ zeroExWrapper, exchange, tokenTransferProxy, weth, zeroEx } = await deployZeroEx(
            web3Wrapper
        ));
    });

    it("should have the correct owner", async () => {
        const owner = await zeroExWrapper.owner();
        expect(owner).to.equal(taker);
    });

    it("should have the correct exchange", async () => {
        const zeroEx = await zeroExWrapper.exchange();
        expect(zeroEx).to.equal(exchange.address);
    });

    it("should have the correct wrapped Ether", async () => {
        const wrappedEth = await zeroExWrapper.weth();
        expect(wrappedEth).to.equal(weth.address);
    });

    it("should allow the owner to withdraw Ether", async () => {
        // Send 1 ether to the exchange wrapper
        const value = web3Wrapper.utils.toWei("1", "ether");
        await web3Wrapper.eth.sendTransaction({
            from: taker,
            to: zeroExWrapper.address,
            value: value
        });
        const zeroExWrapperBalanceBefore = await web3Wrapper.eth.getBalance(
            zeroExWrapper.address
        );
        expect(Number(zeroExWrapperBalanceBefore)).to.equal(Number(value));

        const accountBalanceBefore = await web3Wrapper.eth.getBalance(taker);

        const result = await zeroExWrapper.withdraw(accounts[0], value);
        const zeroExWrapperBalanceAfter = await web3Wrapper.eth.getBalance(
            zeroExWrapper.address
        );
        expect(Number(zeroExWrapperBalanceAfter)).to.equal(0);

        const accountBalanceAfter = await web3Wrapper.eth.getBalance(taker);
        expect(Number(accountBalanceAfter)).to.equal(
            Number(accountBalanceBefore) + Number(value) - Number(result.receipt.gasUsed)
        );
    });

    it("should allow the owner to withdraw tokens", async () => {
        // TODO:
    });

    it("should execute a trade for tokens", async () => {
        const makerAmount = 100000;
        const takerAmount = 400000;

        // Give tokens to the maker
        token = await Token.new([maker], [makerAmount]);

        const order = await createZeroExOrder(
            exchange.address,
            maker,
            token.address,
            weth.address,
            `${makerAmount}`,
            `${takerAmount}`
        );
        const signedOrder = await signOrder(zeroEx, order, maker);

        const values = orderValues(order);
        const addresses = orderAddresses(order);
        const sig = signedOrder.ecSignature;

        // Approve the token transfer proxy to spend tokens on behalf of the maker
        await token.approve(tokenTransferProxy.address, makerAmount, { from: maker });

        const makerWETHBefore = await weth.balanceOf(maker);
        expect(Number(makerWETHBefore)).to.equal(0);

        const takerTokenBefore = await token.balanceOf(taker);
        expect(Number(takerTokenBefore)).to.equal(0);

        // Use the exchange wrapper and the signed order to exchange Ether for tokens
        const result = await zeroExWrapper.getTokens(addresses, values, sig.v, sig.r, sig.s, {
            from: taker,
            value: takerAmount
        });

        const makerWETHAfter = await weth.balanceOf(maker);
        expect(Number(makerWETHAfter)).to.equal(takerAmount);

        const takerTokenAfter = await token.balanceOf(taker);
        expect(Number(takerTokenAfter)).to.equal(makerAmount);
    });

    it("should execute a trade for Ether", async () => {
        const makerAmount = 50000;
        const takerAmount = 30000;

        // Give tokens to the exchange wrapper
        token = await Token.new([zeroExWrapper.address], [takerAmount]);

        const order = await createZeroExOrder(
            exchange.address,
            maker,
            weth.address,
            token.address,
            `${makerAmount}`,
            `${takerAmount}`
        );
        const signedOrder = await signOrder(zeroEx, order, maker);

        const values = orderValues(order);
        const addresses = orderAddresses(order);
        const sig = signedOrder.ecSignature;

        // Create some wrapped ETH for the maker
        await weth.deposit({ from: maker, value: makerAmount });

        const wethBalance = await weth.balanceOf(maker);
        expect(Number(wethBalance)).to.equal(makerAmount);

        const takerETHBefore = await web3Wrapper.eth.getBalance(taker);

        const makerTokenBefore = await token.balanceOf(maker);
        expect(Number(makerTokenBefore)).to.equal(0);

        // Approve the token transfer proxy to spend wrapped Ether on behalf of the maker
        await weth.approve(tokenTransferProxy.address, makerAmount, { from: maker });

        const result = await zeroExWrapper.getEther(addresses, values, sig.v, sig.r, sig.s, {
            from: taker
        });

        const takerETHAfter = await web3Wrapper.eth.getBalance(taker);
        expect(Number(takerETHAfter)).to.equal(
            Number(takerETHBefore) + makerAmount - result.receipt.gasUsed
        );

        const makerTokenAfter = await token.balanceOf(maker);
        expect(Number(makerTokenAfter)).to.equal(takerAmount);
    });
});