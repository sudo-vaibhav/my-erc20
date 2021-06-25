var STCToken = artifacts.require("./STCToken.sol");

contract("DappToken", (accounts) => {
  it("sets the total supply upon deployment", () => {
    return STCToken.deployed()
      .then((instance) => {
        tokenInstance = instance;
        return tokenInstance.totalSupply();
      })
      .then((totalSupply) => {
        assert.equal(
          totalSupply.toNumber(),
          1000000,
          "sets total supply to 1,000,000"
        );
      });
  });
});
