const Bank = artifacts.require("Bank");
const Token = artifacts.require("MockToken");
const chai = require("chai"),
    expect = chai.expect;
import { getTxCost } from "./helpers/utils";

contract("Bank", accounts => {
    // Contracts
    let bank;
    let token;

    // Accounts
    const lender1 = accounts[1];
    const lender2 = accounts[2];
    const borrower = accounts[3];

    // Constants
    const ETH = "0x0000000000000000000000000000000000000000";
    const DEPOSIT_AMOUNT = 1000;
    const WITHDRAW_AMOUNT = 200;
    const PROFIT = 100;

    beforeEach(async () => {
        bank = await Bank.new();
        token = await Token.new(
            [lender1, lender2, borrower],
            [DEPOSIT_AMOUNT, DEPOSIT_AMOUNT, PROFIT]
        );
    });

    it("should deposit Ether", async () => {
        await bank.deposit(ETH, DEPOSIT_AMOUNT, {
            from: lender1,
            value: DEPOSIT_AMOUNT
        });

        const bankBalance = await web3.eth.getBalance(bank.address);
        expect(bankBalance.toNumber()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should deposit tokens", async () => {
        const prevBalance = await token.balanceOf(lender1);
        expect(prevBalance.toNumber()).to.equal(DEPOSIT_AMOUNT);

        await bank.deposit(token.address, DEPOSIT_AMOUNT, { from: lender1 });

        const newBalance = await token.balanceOf(lender1);
        expect(newBalance.toNumber()).to.equal(0);

        const bankBalance = await token.balanceOf(bank.address);
        expect(bankBalance.toNumber()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should withdraw Ether", async () => {
        await bank.deposit(ETH, DEPOSIT_AMOUNT, {
            from: lender1,
            value: DEPOSIT_AMOUNT
        });

        const prevLenderBalance = await web3.eth.getBalance(lender1);
        const result = await bank.withdraw(ETH, WITHDRAW_AMOUNT, {
            from: lender1
        });

        const txCost = await getTxCost(web3, result);

        const newLenderBalance = await web3.eth.getBalance(lender1);
        expect(newLenderBalance.toNumber()).to.equal(
            prevLenderBalance
                .plus(WITHDRAW_AMOUNT)
                .minus(txCost)
                .toNumber()
        );

        const bankBalance = await web3.eth.getBalance(bank.address);
        expect(bankBalance.toNumber()).to.equal(
            DEPOSIT_AMOUNT - WITHDRAW_AMOUNT
        );
    });

    it("should withdraw tokens", async () => {
        await bank.deposit(token.address, DEPOSIT_AMOUNT, { from: lender1 });
        await bank.withdraw(token.address, WITHDRAW_AMOUNT, { from: lender1 });

        const balance = await token.balanceOf(bank.address);
        expect(balance.toNumber()).to.equal(DEPOSIT_AMOUNT - WITHDRAW_AMOUNT);
    });

    // Deposit from both lenders and simulate an arbitrage profit
    const depositAndProfit = async tokenAddr => {
        const depositValue = tokenAddr == ETH ? DEPOSIT_AMOUNT : 0;
        await bank.deposit(tokenAddr, DEPOSIT_AMOUNT, {
            from: lender1,
            value: depositValue
        });
        await bank.deposit(tokenAddr, DEPOSIT_AMOUNT, {
            from: lender2,
            value: depositValue
        });

        // Simulate arbitrage profit
        const profitValue = tokenAddr == ETH ? PROFIT : 0;
        await bank.repay(tokenAddr, PROFIT, {
            from: borrower,
            value: profitValue
        });
    };

    it("should calculate account balances with Ether", async () => {
        await depositAndProfit(ETH);

        const balance = await bank.balanceOf(ETH, lender1);
        expect(balance.toNumber()).to.equal(DEPOSIT_AMOUNT + PROFIT / 2);
    });

    it("should calculate account balances with tokens", async () => {
        await depositAndProfit(token.address);

        const balance = await bank.balanceOf(token.address, lender1);
        expect(balance.toNumber()).to.equal(DEPOSIT_AMOUNT + PROFIT / 2);
    });

    it("should withdraw profits in ETH", async () => {
        await depositAndProfit(ETH);
        const prevBalance = web3.eth.getBalance(lender1);

        // Lender 1 withdraws entire balance
        const result = await bank.withdraw(ETH, DEPOSIT_AMOUNT, {
            from: lender1
        });
        const txCost = await getTxCost(web3, result);
        const newBalance = web3.eth.getBalance(lender1);

        // Lender 1 should get half of the profits since she owns half of the deposits
        expect(newBalance.toNumber()).to.equal(
            prevBalance.plus(DEPOSIT_AMOUNT + PROFIT / 2).minus(txCost).toNumber()
        );
    });

    it("should withdraw profits in tokens", async () => {
        await depositAndProfit(token.address);

        // Lender 1 withdraws entire balance
        await bank.withdraw(token.address, DEPOSIT_AMOUNT + PROFIT / 2, {
            from: lender1
        });
        const balance = await token.balanceOf(lender1);

        // Lender 1 should get half of the profits since she owns half of the deposits
        expect(balance.toNumber()).to.equal(DEPOSIT_AMOUNT + PROFIT / 2);
    });
});