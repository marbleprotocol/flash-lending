const FlashLender = artifacts.require('FlashLender');
const Bank = artifacts.require('Bank');
const Token = artifacts.require('MockToken');
const Arbitrage = artifacts.require('MockArbitrage');
const ReentrancyArbitrage = artifacts.require('MockReentrancyArbitrage');
const chai = require('chai'),
  expect = chai.expect;
chai.should();
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { getTxCost } from './helpers/utils';
import EVMRevert from './helpers/EVMRevert';

const web3Beta = new Web3(web3.currentProvider);

contract('FlashLender', accounts => {
  // Contracts
  let bank;
  let token;
  let flashLender;

  // Accounts
  const [owner, borrower] = accounts;

  // Constants
  const ETH = '0x0000000000000000000000000000000000000000';
  const DEPOSIT_AMOUNT = 1000;
  const PROFIT = 100;

  beforeEach(async () => {
    bank = await Bank.new({ from: owner });
    flashLender = await FlashLender.new('0x0', 0, { from: owner });
    token = await Token.new([owner, borrower], [DEPOSIT_AMOUNT, PROFIT]);
  });

  it('should allow the owner to set the bank', async () => {
    await flashLender
      .setBank(bank.address, {
        from: owner
      })
      .should.not.be.rejectedWith(EVMRevert);

    const flashLenderBank = await flashLender.bank();
    expect(flashLenderBank).to.equal(bank.address);
  });

  it('should allow the owner to set the fee', async () => {
    const feeAmount = 100;
    await flashLender
      .setFee(feeAmount, {
        from: owner
      })
      .should.not.be.rejectedWith(EVMRevert);

    const flashLenderFee = await flashLender.fee();
    expect(Number(flashLenderFee)).to.equal(feeAmount);
  });

  it('should revert if an Ether borrower does not repay the bank', async () => {
    const arbitrage = await Arbitrage.new(flashLender.address, {
      from: owner
    });

    await bank.deposit(ETH, DEPOSIT_AMOUNT, {
      from: owner,
      value: DEPOSIT_AMOUNT
    });

    // MockArbitrage does not repay bank
    await arbitrage
      .submitTrade(ETH, 100, borrower, '', { from: borrower })
      .should.be.rejectedWith(EVMRevert);
  });

  it('should revert if a token borrower does not repay the bank', async () => {
    const arbitrage = await Arbitrage.new(flashLender.address, {
      from: owner
    });

    await bank.deposit(token.address, DEPOSIT_AMOUNT, {
      from: owner
    });

    // MockArbitrage does not repay bank
    await arbitrage
      .submitTrade(token.address, 100, borrower, '', { from: borrower })
      .should.be.rejectedWith(EVMRevert);
  });

  it('borrow should not allow reentry', async () => {
    const arbitrage = await ReentrancyArbitrage.new(flashLender.address, {
      from: owner
    });

    await bank.deposit(ETH, DEPOSIT_AMOUNT, {
      from: owner,
      value: DEPOSIT_AMOUNT
    });

    await arbitrage
      .submitTrade(ETH, 100, borrower, '', { from: borrower })
      .should.be.rejectedWith(EVMRevert);
  });
});
