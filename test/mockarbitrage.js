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
    const DEPOSIT_AMOUNT = 100000;
    const ETH = "0x0000000000000000000000000000000000000000";
    const ARBITRAGE_AMOUNT = 50000;

    const FEE = 10 ** 15; // 10**15 / 10*18 = .1% fee

    // const Web3 = require("web3");
    // const web3Wrapper = new Web3(web3.currentProvider);

    const deployArbitrage = async fee => {
        bank = await Bank.new();
        lend = await Lend.new(bank.address, fee);
        arbitrage = await Arbitrage.new(lend.address, { from: trader });
        const feeAmount = ARBITRAGE_AMOUNT * FEE / 10 ** 18;
        token = await Token.new(
            [lender, arbitrage.address],
            [DEPOSIT_AMOUNT, Math.ceil(feeAmount)]
        );

        await web3.eth.sendTransaction({
            from: accounts[2],
            to: arbitrage.address,
            value: Math.ceil(feeAmount)
        });

        // Approve the Lend contract as a bank borrower
        await bank.addBorrower(lend.address);

        // Deposit ZRX and ETH to the bank from the lender
        await bank.deposit(token.address, DEPOSIT_AMOUNT, { from: lender });
        await bank.deposit(ETH, DEPOSIT_AMOUNT, {
            from: lender,
            value: DEPOSIT_AMOUNT
        });
        return {
            bank,
            lend,
            arbitrage,
            token
        };
    };

    it("should arbitrage with Ether", async () => {
        ({ bank, lend, arbitrage, token } = await deployArbitrage(0));
        await arbitrage.borrow(ETH, ARBITRAGE_AMOUNT, { from: trader });
        const bankETHAfter = await web3.eth.getBalance(bank.address);
        expect(bankETHAfter.toNumber()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should arbitrage with tokens", async () => {
        ({ bank, lend, arbitrage, token } = await deployArbitrage(0));
        await arbitrage.borrow(token.address, ARBITRAGE_AMOUNT, {
            from: trader
        });
        const bankZRXAfter = await token.balanceOf(bank.address);
        expect(bankZRXAfter.toNumber()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should revert on incomplete repayment of ETH", async () => {
        ({ bank, lend, arbitrage, token } = await deployArbitrage(0));
        await arbitrage.setRepay(-ARBITRAGE_AMOUNT / 2);
        return expect(
            arbitrage.borrow(ETH, ARBITRAGE_AMOUNT, { from: trader })
        ).to.be.rejectedWith("revert");
    });

    it("should revert on incomplete repayment of token", async () => {
        ({ bank, lend, arbitrage, token } = await deployArbitrage(0));
        await arbitrage.setRepay(-ARBITRAGE_AMOUNT / 2);
        return expect(
            arbitrage.borrow(token.address, ARBITRAGE_AMOUNT, { from: trader })
        ).to.be.rejectedWith("revert");
    });

    it("should repay correctly with nonzero fee on ETH", async () => {
        ({ bank, lend, arbitrage, token } = await deployArbitrage(FEE));
        await arbitrage.borrow(ETH, ARBITRAGE_AMOUNT, {
            from: trader
        });
        const bankETHAfter = await web3.eth.getBalance(bank.address);
        expect(bankETHAfter.toNumber()).to.equal(
            DEPOSIT_AMOUNT + ARBITRAGE_AMOUNT * FEE / (10 ** 18)
        );
    });

    it("should repay correctly with nonzero fee on token", async () => {
        ({ bank, lend, arbitrage, token } = await deployArbitrage(FEE));
        await arbitrage.borrow(token.address, ARBITRAGE_AMOUNT, {
            from: trader
        });
        const bankZRXAfter = await token.balanceOf(bank.address);
        expect(bankZRXAfter.toNumber()).to.equal(
            DEPOSIT_AMOUNT + ARBITRAGE_AMOUNT * FEE / (10 ** 18)
        );
    });
});