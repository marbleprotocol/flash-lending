const Bank = artifacts.require("Bank");
const Token = artifacts.require("MockToken");
const chai = require("chai"),
    expect = chai.expect;

contract("Bank", accounts => {
    // Contracts
    let bank;
    let token;

    // Accounts
    const lender = accounts[0];

    // Constants
    const ETH = "0x0000000000000000000000000000000000000000";
    const DEPOSIT_AMOUNT = 1000;

    beforeEach(async () => {
        bank = await Bank.new();
        token = await Token.new([lender], [DEPOSIT_AMOUNT]);
    });

    it("should deposit Ether", async () => {
        await bank.deposit(ETH, DEPOSIT_AMOUNT, { value: DEPOSIT_AMOUNT });

        const bankETH = await web3.eth.getBalance(bank.address);
        expect(bankETH.toNumber()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should deposit tokens", async () => {
        const lenderZRXBefore = await token.balanceOf(lender);
        expect(lenderZRXBefore.toNumber()).to.equal(DEPOSIT_AMOUNT);

        await bank.deposit(token.address, DEPOSIT_AMOUNT);

        const lenderZRXAfter = await token.balanceOf(lender);
        expect(lenderZRXAfter.toNumber()).to.equal(0);

        const bankZRX = await token.balanceOf(bank.address);
        expect(bankZRX.toNumber()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should withdraw Ether", async () => {
        await bank.deposit(ETH, DEPOSIT_AMOUNT, { value: DEPOSIT_AMOUNT });
        await bank.withdraw(ETH, DEPOSIT_AMOUNT);

        const bankETH = await web3.eth.getBalance(bank.address);
        expect(bankETH.toNumber()).to.equal(0);
    });

    it("should withdraw tokens", async () => {
        await bank.deposit(token.address, DEPOSIT_AMOUNT);
        await bank.withdraw(token.address, DEPOSIT_AMOUNT);

        const bankZRX = await token.balanceOf(bank.address);
        expect(bankZRX.toNumber()).to.equal(0);
    });

    // it("should deposit", async () => {
    //     const creditBalance = await creditToken.balanceOf(lender);
    //     expect(creditBalance.toNumber()).to.equal(constants.LEND_AMOUNT);
    // });

    // it("should withdraw", async () => {
    //     await bank.withdraw(base.address, constants.LEND_AMOUNT, { from: lender });

    //     const creditBalance = await creditToken.balanceOf(lender);
    //     expect(creditBalance.toNumber()).to.equal(0);
    // });
});