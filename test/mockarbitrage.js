const Bank = artifacts.require("Bank");
const Lend = artifacts.require("Lend");
const Arbitrage = artifacts.require("MockArbitrage");
const Token = artifacts.require("MockToken");

const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

contract("MockArbitrage", accounts => {
    // Contracts
    let bank;
    let lend;
    let arbitrage;
    let token;

    // Accounts
    const lender = accounts[0];
    const trader = accounts[1];

    // Constants
    const DEPOSIT_AMOUNT = 1000;
    const ETH = "0x0000000000000000000000000000000000000000";
    const ARBITRAGE_AMOUNT = 500;
    const FEE = 0;
    // FEE IN LEND IS 0;

    beforeEach(async () => {
        bank = await Bank.new();
        lend = await Lend.new(bank.address);
        arbitrage = await Arbitrage.new(lend.address, { from: trader });
        token = await Token.new([lender], [DEPOSIT_AMOUNT]);

        // Approve the Lend contract as a bank borrower
        await bank.addBorrower(lend.address);

        // Deposit ZRX and ETH to the bank from the lender
        await bank.deposit(token.address, DEPOSIT_AMOUNT, { from: lender });
        await bank.deposit(ETH, DEPOSIT_AMOUNT, {
            from: lender,
            value: DEPOSIT_AMOUNT
        });
    });

    it("should arbitrage with Ether", async () => {
        await arbitrage.borrow(ETH, ARBITRAGE_AMOUNT, { from: trader });
        const bankETHAfter = await web3.eth.getBalance(bank.address);
        expect(bankETHAfter.toNumber()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should arbitrage with tokens", async () => {
        await arbitrage.borrow(token.address, ARBITRAGE_AMOUNT, { from: trader });
        const bankZRXAfter = await token.balanceOf(bank.address);
        expect(bankZRXAfter.toNumber()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should revert on incomplete repayment of ETH", async () => {
        await arbitrage.setRepay(ARBITRAGE_AMOUNT / 2);
        return expect(
            arbitrage.borrow(ETH, ARBITRAGE_AMOUNT, { from: trader })
        ).to.be.rejectedWith("revert");
    });

    it("should revert on incomplete repayment of token", async () => {
        await arbitrage.setRepay(ARBITRAGE_AMOUNT / 2);
        return expect(
            arbitrage.borrow(token.address, ARBITRAGE_AMOUNT, { from: trader })
        ).to.be.rejectedWith("revert");
    });

    // TODO: add test for fees
});