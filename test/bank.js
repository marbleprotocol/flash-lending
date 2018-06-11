const Bank = artifacts.require("Bank");
const Token = artifacts.require("MockToken");
const chai = require("chai"),
    expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

contract("Bank", accounts => {
    // Contracts
    let bank;
    let token;

    // Accounts
    const lender = accounts[0];
    const borrower = accounts[1];

    // Constants
    const ETH = "0x0000000000000000000000000000000000000000";
    const DEPOSIT_AMOUNT = 1000;
    const PROFIT = 10;

    beforeEach(async () => {
        bank = await Bank.new();
        token = await Token.new([lender, borrower], [DEPOSIT_AMOUNT, PROFIT]);
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

    it("should withdraw profits in tokens", async () => {
        await bank.deposit(token.address, DEPOSIT_AMOUNT, { from: lender });
        await bank.repay(token.address, PROFIT, { from: borrower }); // create profit
        const withdrawAmount = DEPOSIT_AMOUNT + PROFIT;
        await bank.withdraw(token.address, withdrawAmount, { from: lender });
        const lenderZRXAfter = await token.balanceOf(lender);
        expect(withdrawAmount).to.equal(lenderZRXAfter.toNumber());
    });

    it("should withdraw profits in ETH", async () => {
        await bank.deposit(ETH, DEPOSIT_AMOUNT, { from: lender });
        await bank.repay(ETH, PROFIT, { from: borrower }); // create profit
        const withdrawAmount = DEPOSIT_AMOUNT + PROFIT;
        const allocation = await bank.getAllocation(ETH,lender);
        console.log(allocation.toNumber())
        //await bank.withdraw(ETH, withdrawAmount, { from: lender });
        // const lenderETHAfter = await web3.eth.getBalance(lender);
        // expect(withdrawAmount).to.equal(lenderETHAfter.toNumber());
    });
});