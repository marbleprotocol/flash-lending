const FlashLender = artifacts.require("FlashLender");

contract("FlashLender", accounts => {

  it("should allow the owner to set the bank", async () => {
    // TODO:
  });

  it("should allow the owner to set the fee", async () => {
    // TODO:
  });

  it("should revert if an Ether borrower does not repay the bank", async () => {
    // TODO:
  });

  it("should revert if a token borrower does not repay the bank", async () => {
    // TODO:
  });

  it("borrow should not allow reentry", async () => {
    // TODO:
  });

});