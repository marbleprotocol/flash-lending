const Token = artifacts.require("MockToken");
import { EtherDeltaUtils } from "./helpers/EtherDeltaUtils";

const Web3 = require("web3");
const web3Beta = new Web3(web3.currentProvider);

const { BN } = web3Beta.utils;

contract("EtherDeltaWrapper", accounts => {
  // Accounts
  const owner = accounts[0];
  const taker = accounts[1];
  const maker = accounts[2];

  const makerPrivateKey = "0xfd88f66d3c9a809a45b0116e2b314efad7cb73257e0f3259ea8da663459dfcdf";

  let etherDeltaUtils, etherDeltaWrapper, etherDelta;

  beforeEach(async () => {
    etherDeltaUtils = new EtherDeltaUtils(web3Beta);
    await etherDeltaUtils.init();
    ({ etherDelta, etherDeltaWrapper } = etherDeltaUtils);
  });

  it("should have the correct owner", async () => {
    const wrapperOwner = await etherDeltaWrapper.owner();
    expect(wrapperOwner).to.equal(owner);
  });

  it("should have the correct exchange", async () => {
    const etherDeltaWrapperExchange = await etherDeltaWrapper.exchange();
    expect(etherDelta.address).to.equal(etherDeltaWrapperExchange);
  });

  it("should execute a trade for tokens", async () => {
    const makerAmount = 100000;
    const takerAmount = 400000;
    const nonce = 1;
    const expires = 1546300800;

    // Give tokens to the maker
    const token = await Token.new([maker], [makerAmount]);

    await token.approve(etherDelta.address, amount, {
      from: maker
    });

    await etherDelta.depositToken(token.address, amount, {
      from: maker
    });

    // Place order for maker
    await etherDelta.order(0, takerAmount, token.address, makerAmount, expires, nonce, {
      from: maker
    });

    const sha256Hash = await etherDelta.hash(
      0,
      takerAmount,
      token.address,
      makerAmount,
      expires,
      nonce
    );

    const ecSignature = web3Beta.eth.accounts.sign(sha256Hash, makerPrivateKey);
    const { r, s, v } = ecSignature;

    const makerETHBefore = await etherDelta.balanceOf(0, maker);
    expect(Number(makerETHBefore)).to.equal(0);

    const takerTokenBefore = await token.balanceOf(taker);
    expect(Number(takerTokenBefore)).to.equal(0);

    // Use the exchange wrapper and the signed order to exchange Ether for tokens
    const result = await etherDeltaWrapper.getTokens(
      takerAmount,
      token.address,
      makerAmount,
      expires,
      nonce,
      maker,
      v,
      r,
      s,
      {
        from: taker,
        value: takerAmount
      }
    );

    const makerETHAfter = await etherDelta.balanceOf(0, maker);
    expect(Number(makerETHAfter)).to.equal(takerAmount);

    const takerTokenAfter = await token.balanceOf(taker);
    expect(Number(takerTokenAfter)).to.equal(makerAmount);
  });

  it("should execute a trade for Ether", async () => {
    const makerAmount = 50000;
    const takerAmount = 30000;
    const nonce = 1;
    const expires = 1546300800;

    // Give tokens to the maker
    const token = await Token.new([etherDeltaWrapper.address], [takerAmount]);

    await etherDelta.deposit({
      from: maker,
      value: makerAmount
    });

    // Place order for maker
    await etherDelta.order(token.address, takerAmount, 0, makerAmount, expires, nonce, {
      from: maker
    });

    const sha256Hash = await etherDelta.hash(
      token.address,
      takerAmount,
      0,
      makerAmount,
      expires,
      nonce
    );

    const ecSignature = web3Beta.eth.accounts.sign(sha256Hash, makerPrivateKey);
    const { r, s, v } = ecSignature;

    const makerTokenBefore = await etherDelta.balanceOf(token.address, maker);
    expect(Number(makerTokenBefore)).to.equal(0);

    const takerETHBefore = await web3Beta.eth.getBalance(taker);

    // Use the exchange wrapper and the signed order to exchange token for ETH
    const { receipt, tx } = await etherDeltaWrapper.getEther(
      token.address,
      takerAmount,
      makerAmount,
      expires,
      nonce,
      maker,
      v,
      r,
      s,
      {
        from: taker
      }
    );

    const [makerTokenAfter, takerETHAfter, { gasPrice }] = await Promise.all([
      etherDelta.balanceOf(token.address, maker),
      web3Beta.eth.getBalance(taker),
      web3Beta.eth.getTransaction(tx)
    ]);

    expect(Number(makerTokenAfter)).to.equal(takerAmount);

    const { gasUsed } = receipt;

    const bnGasPrice = new BN(gasPrice);
    const bnGasUsed = new BN(gasUsed);
    const bnMakerAmount = new BN(makerAmount);
    const bnTakerETHBefore = new BN(takerETHBefore);
    const txCost = bnGasPrice.mul(bnGasUsed);

    const expectedFinalETH = Number(bnTakerETHBefore.add(bnMakerAmount).sub(txCost));

    expect(Number(takerETHAfter)).to.equal(expectedFinalETH);
  });
});
