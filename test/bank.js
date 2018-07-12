const Bank = artifacts.require('Bank');
const Token = artifacts.require('MockToken');
const chai = require('chai'),
  expect = chai.expect;
chai.should();
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { getTxCost } from './helpers/utils';
import EVMRevert from './helpers/EVMRevert';

const web3Beta = new Web3(web3.currentProvider);

contract('Bank', accounts => {
  // Contracts
  let bank;
  let token;

  // Accounts
  const [owner, lender, borrower, otherBorrower] = accounts;

  // Constants
  const ETH = '0x0000000000000000000000000000000000000000';
  const DEPOSIT_AMOUNT = 1000;
  const WITHDRAW_AMOUNT = 200;
  const PROFIT = 100;

  beforeEach(async () => {
    bank = await Bank.new({ from: lender });
    token = await Token.new([lender, borrower], [DEPOSIT_AMOUNT, PROFIT]);
  });

  it('should deposit Ether', async () => {
    const bal = await web3Beta.eth.getBalance(lender);
    await bank.deposit(ETH, DEPOSIT_AMOUNT, {
      from: lender,
      value: DEPOSIT_AMOUNT
    });

    const bankBalance = await web3Beta.eth.getBalance(bank.address);
    expect(Number(bankBalance)).to.equal(DEPOSIT_AMOUNT);
  });

  it('should deposit tokens', async () => {
    const prevBalance = await token.balanceOf(lender);
    expect(Number(prevBalance)).to.equal(DEPOSIT_AMOUNT);

    await bank.deposit(token.address, DEPOSIT_AMOUNT, { from: lender });

    const newBalance = await token.balanceOf(lender);
    expect(Number(newBalance)).to.equal(0);

    const bankBalance = await token.balanceOf(bank.address);
    expect(Number(bankBalance)).to.equal(DEPOSIT_AMOUNT);
  });

  it('should withdraw Ether', async () => {
    await bank.deposit(ETH, DEPOSIT_AMOUNT, {
      from: lender,
      value: DEPOSIT_AMOUNT
    });

    const prevBalance = await web3Beta.eth.getBalance(lender);
    const result = await bank.withdraw(ETH, WITHDRAW_AMOUNT, {
      from: lender
    });

    const txCost = await getTxCost(web3Beta, result);

    const newBalance = await web3Beta.eth.getBalance(lender);
    expect(Number(newBalance)).to.equal(
      BigNumber(prevBalance)
        .plus(WITHDRAW_AMOUNT)
        .minus(txCost)
        .toNumber()
    );

    const bankBalance = await web3Beta.eth.getBalance(bank.address);
    expect(Number(bankBalance)).to.equal(DEPOSIT_AMOUNT - WITHDRAW_AMOUNT);
  });

  it('should withdraw tokens', async () => {
    await bank.deposit(token.address, DEPOSIT_AMOUNT, { from: lender });
    await bank.withdraw(token.address, WITHDRAW_AMOUNT, { from: lender });

    const balance = await token.balanceOf(bank.address);
    expect(Number(balance)).to.equal(DEPOSIT_AMOUNT - WITHDRAW_AMOUNT);
  });

  // Deposit from both lenders and simulate an arbitrage profit
  const depositAndProfit = async tokenAddr => {
    const depositValue = tokenAddr == ETH ? DEPOSIT_AMOUNT : 0;
    await bank.deposit(tokenAddr, DEPOSIT_AMOUNT, {
      from: lender,
      value: depositValue
    });

    // Simulate arbitrage profit
    const profitValue = tokenAddr == ETH ? PROFIT : 0;
    await bank.repay(tokenAddr, PROFIT, {
      from: borrower,
      value: profitValue
    });
  };

  it('should calculate correct bank balance with Ether', async () => {
    await bank.deposit(ETH, DEPOSIT_AMOUNT, {
      from: lender,
      value: DEPOSIT_AMOUNT
    });
    const bankBalance = await bank.totalSupplyOf(ETH);
    expect(bankBalance.toNumber()).to.equal(DEPOSIT_AMOUNT);
  });

  it('should calculate correct bank balance with Tokens', async () => {
    await bank.deposit(token.address, DEPOSIT_AMOUNT, { from: lender });
    const bankBalance = await bank.totalSupplyOf(token.address);
    expect(bankBalance.toNumber()).to.equal(DEPOSIT_AMOUNT);
  });

  it('should withdraw profits in ETH', async () => {
    await depositAndProfit(ETH);
    const prevBalance = await web3Beta.eth.getBalance(lender);

    // withdraws entire balance
    const result = await bank.withdraw(ETH, DEPOSIT_AMOUNT, {
      from: lender
    });
    const txCost = await getTxCost(web3Beta, result);
    const newBalance = await web3Beta.eth.getBalance(lender);

    // Lender 1 should get half of the profits since she owns half of the deposits
    expect(Number(newBalance)).to.equal(
      BigNumber(prevBalance)
        .plus(DEPOSIT_AMOUNT + PROFIT / 2)
        .minus(txCost)
        .toNumber()
    );
  });

  it('should withdraw profits in tokens', async () => {
    await depositAndProfit(token.address);

    // Lender 1 withdraws entire balance
    await bank.withdraw(token.address, DEPOSIT_AMOUNT + PROFIT / 2, {
      from: lender
    });
    const balance = await token.balanceOf(lender);

    // Lender 1 should get half of the profits since she owns half of the deposits
    expect(balance.toNumber()).to.equal(DEPOSIT_AMOUNT + PROFIT / 2);
  });

  it('should allow the owner to approve a new borrower', async () => {
    await bank.deposit(ETH, DEPOSIT_AMOUNT, {
      from: lender,
      value: DEPOSIT_AMOUNT
    });

    await bank.addBorrower(borrower, {
      from: lender
    });

    const prevBalance = await web3Beta.eth.getBalance(borrower);

    const result = await bank
      .borrow(ETH, DEPOSIT_AMOUNT, {
        from: borrower
      })
      .should.not.be.rejectedWith(EVMRevert);

    const txCost = await getTxCost(web3Beta, result);
    const newBalance = await web3Beta.eth.getBalance(borrower);

    expect(Number(newBalance)).to.equal(
      BigNumber(prevBalance)
        .plus(DEPOSIT_AMOUNT)
        .minus(txCost)
        .toNumber()
    );
  });

  it('should revert if an unauthorized account tries to approve a new borrower', async () => {
    await bank.deposit(ETH, DEPOSIT_AMOUNT, {
      from: lender,
      value: DEPOSIT_AMOUNT
    });

    await bank
      .addBorrower(borrower, {
        from: borrower
      })
      .should.be.rejectedWith(EVMRevert);
  });

  it('should allow the owner to revoke approval of a borrower', async () => {
    await bank.deposit(ETH, DEPOSIT_AMOUNT, {
      from: lender,
      value: DEPOSIT_AMOUNT
    });

    await bank.addBorrower(borrower, {
      from: lender
    });

    await bank
      .borrow(ETH, 100, {
        from: borrower
      })
      .should.not.be.rejectedWith(EVMRevert);

    await bank.removeBorrower(borrower, {
      from: lender
    });

    await bank
      .borrow(ETH, 100, {
        from: borrower
      })
      .should.be.rejectedWith(EVMRevert);
  });

  it('should allow an approved borrower to borrow tokens', async () => {
    await bank.deposit(token.address, DEPOSIT_AMOUNT, {
      from: lender
    });

    await bank.addBorrower(borrower, {
      from: lender
    });

    const prevBalance = await token.balanceOf(borrower);
    expect(Number(prevBalance)).to.equal(PROFIT);
    await bank
      .borrow(token.address, 100, {
        from: borrower
      })
      .should.not.be.rejectedWith(EVMRevert);

    const newBalance = await token.balanceOf(borrower);
    expect(Number(newBalance)).to.equal(
      BigNumber(prevBalance)
        .plus(100)
        .toNumber()
    );
  });
});
