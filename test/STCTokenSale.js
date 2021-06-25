var STCTokenSale = artifacts.require("./STCTokenSale.sol");
var STCToken = artifacts.require("./STCToken.sol");

contract("STCTokenSale", (accounts) => {
  tokenPrice = Math.pow(10, 15); // 10^15 Wei or 0.001 ETH
  numberOfTokens = 10;
  tokensAvailable = 750000;
  tokensMoreThanAvailable = 800000;
  admin = accounts[0];
  buyer = accounts[6];

  it("initializes the contract with the correct values", () => {
    return STCTokenSale.deployed()
      .then((i) => {
        tokenSaleInstance = i;
        return tokenSaleInstance.address;
      })
      .then((address) => {
        assert.notEqual(address, 0x0, "has contract address");
        return tokenSaleInstance.tokenContract();
      })
      .then((address) => {
        assert.notEqual(address, 0x0, "has token contract address");

        return tokenSaleInstance.tokenPrice();
      })
      .then((price) => {
        assert.equal(price, tokenPrice);
      });
  });

  it("facilitates token buying", () => {
    return STCToken.deployed().then((i) => {
      tokenInstance = i;
      return STCTokenSale.deployed()
        .then(async (i) => {
          tokenSaleInstance = i;

          return tokenInstance.transfer(
            tokenSaleInstance.address,
            tokensAvailable,
            {
              from: admin,
            }
          );
        })
        .then(() => {
          value = numberOfTokens * tokenPrice;
          return tokenSaleInstance.buyTokens(numberOfTokens, {
            from: buyer,
            value,
          });
        })
        .then((receipt) => {
          assert.equal(receipt.logs.length, 1, "triggers one event");
          assert.equal(
            receipt.logs[0].event,
            "Sell",
            "should be the Sell event"
          );
          assert.equal(
            receipt.logs[0].args._buyer,
            buyer,
            "logs the account from which transfer is happening"
          );
          assert.equal(
            receipt.logs[0].args._amount,
            numberOfTokens,
            "logs the account to which transfer is happening"
          );

          return tokenSaleInstance.tokensSold();
        })
        .then((amount) => {
          assert.equal(
            amount,
            numberOfTokens,
            "increments number of token solds"
          );

          // now check updated amount of tokens in contract
          return tokenInstance.balanceOf(tokenSaleInstance.address);
        })
        .then((balance) => {
          assert.equal(
            balance.toNumber(),
            tokensAvailable - numberOfTokens,
            "number of tokens with the contract should reduce"
          );

          // trying to buy tokens different from ether value
          return tokenSaleInstance.buyTokens(numberOfTokens, {
            from: buyer,
            value: 1, // 1 Wei, too low
          });
        })
        .then(assert.fail)
        .catch((error) => {
          assert(
            error.toString().indexOf("revert") >= 0,
            "buy should fail if amount is lower"
          );

          // trying to buy more than max amount of tokens available
          return tokenSaleInstance.buyTokens(tokensMoreThanAvailable, {
            from: buyer,
            value: 1000,
          });
        })
        .then(assert.fail)
        .catch((error) => {
          assert(
            error.toString().indexOf("revert") >= 0,
            "not enough tokens available to sell"
          );
        });
    });
  });

  it("successfully ends the sale", () => {
    return STCToken.deployed()
      .then((i) => {
        tokenInstance = i;
        return STCTokenSale.deployed();
      })
      .then((i) => {
        tokenSaleInstance = i;

        // trying to end sale from an account who is not the admin
        return tokenSaleInstance.endSale({ from: buyer });
      })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.toString().indexOf("revert") >= 0,
          "the person to end the sale should be buyer"
        );

        // actually end sale as admin
        return tokenSaleInstance.endSale({ from: admin });
      })
      .then((receipt) => {
        // now check for balance
        return tokenInstance.balanceOf(admin);
      })
      .then((balance) => {
        assert.equal(
          balance.toNumber(),
          1000000 - numberOfTokens,
          "admin should get back all their tokens"
        );

        // if sale contract has been destroyed then its bytecode should be wiped out
        return web3.eth.getCode(tokenSaleInstance.address);
      })
      .then((code) => {
        assert.equal(code, "0x", "sale contract code was reset");
      });
  });
});
