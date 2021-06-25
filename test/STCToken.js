var STCToken = artifacts.require("./STCToken.sol");

contract("DappToken", (accounts) => {
  const initialSupply = 1000000;
  it("sets the total supply upon deployment", () => {
    return STCToken.deployed()
      .then((instance) => {
        tokenInstance = instance;
        return tokenInstance.totalSupply();
      })
      .then((totalSupply) => {
        assert.equal(
          totalSupply.toNumber(),
          initialSupply,
          "sets total supply to 1,000,000"
        );

        return tokenInstance.balanceOf(accounts[0]);
      })
      .then((adminBalance) => {
        assert.equal(
          adminBalance.toNumber(),
          initialSupply,
          "allocates the initial supply to admin account"
        );
      });
  });

  it("initializes contract with correct values", () => {
    return STCToken.deployed()
      .then((instance) => {
        tokenInstance = instance;
        return tokenInstance.name();
      })
      .then((name) => {
        assert.equal(name, "STC Token", "has the correct name");
        return tokenInstance.symbol();
      })
      .then((symbol) => {
        assert.equal(symbol, "STC", "has the correct symbol");
      });
  });

  it("transfers ownership of tokens", () => {
    return STCToken.deployed()
      .then((i) => {
        tokenInstance = i;
        return tokenInstance.transfer.call(accounts[1], 9999999);
      })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.toString().indexOf("revert") >= 0,
          "error message must contain revert"
        );

        return tokenInstance.transfer.call(accounts[1], 250000, {
          from: accounts[0],
        });
      })
      .then((success) => {
        assert(success, "transfer should be successful");
        return tokenInstance.transfer(accounts[1], 250000, {
          from: accounts[0],
        });
      })
      .then((receipt) => {
        assert.equal(receipt.logs.length, 1, "triggers one event");
        assert.equal(
          receipt.logs[0].event,
          "Transfer",
          "should be the Transfer event"
        );
        assert.equal(
          receipt.logs[0].args._from,
          accounts[0],
          "logs the account from which transfer is happening"
        );
        assert.equal(
          receipt.logs[0].args._to,
          accounts[1],
          "logs the account to which transfer is happening"
        );
        assert.equal(
          receipt.logs[0].args._value,
          250000,
          "logs the transfer amount"
        );

        return tokenInstance.balanceOf(accounts[1]);
      })
      .then((balance) => {
        assert(
          balance.toNumber(),
          250000,
          "balance should equal the amount it received"
        );
        return tokenInstance.balanceOf(accounts[0]);
      })
      .then((balance) => {
        assert.equal(
          balance.toNumber(),
          750000,
          "balance should be reduced after transfer"
        );
      });
  });
});
