const KyberWrapper = artifacts.require("KyberWrapper");
const Token = artifacts.require("MockToken");
const Web3 = require("web3");
const web3Wrapper = new Web3(web3.currentProvider);
import { NULL_ADDRESS } from "./util/constants"

contract("KyberWrapper", accounts => {
    // Contracts
    let exchangeWrapper;
    let token;

    // Accounts
    const taker = accounts[0];

    const ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // ETH

    const MAX_AMOUNT = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

    beforeEach(async () => {
        exchangeWrapper = await KyberWrapper.new(ETH);
        token = await Token.new([exchangeWrapper.address], [1000]);
    });

    it("should get Ether", async () => {
        const result = await exchangeWrapper.getEther(token.address, taker, MAX_AMOUNT, 0, NULL_ADDRESS);
        console.log(result);
    });
});