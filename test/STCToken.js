var STCToken = artifacts.require("./STCToken.sol");

contract("STCToken", (accounts) => {
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

  it("approves tokens for delegated transfers", () => {
    return STCToken.deployed()
      .then((i) => {
        tokenInstance = i;
        return tokenInstance.approve.call(accounts[1], 100);
      })
      .then((success) => {
        assert(success, "approval must be successful");
        return tokenInstance.approve(accounts[1], 100);
      })
      .then((receipt) => {
        assert.equal(receipt.logs.length, 1, "triggers one event");
        assert.equal(
          receipt.logs[0].event,
          "Approval",
          "should be the Approval event"
        );
        assert.equal(
          receipt.logs[0].args._owner,
          accounts[0],
          "logs the account from which allowance is being given"
        );
        assert.equal(
          receipt.logs[0].args._spender,
          accounts[1],
          "logs the account to which allowance is being given"
        );
        assert.equal(
          receipt.logs[0].args._value,
          100,
          "logs the allowance amount"
        );

        return tokenInstance.allowance(accounts[0], accounts[1]);
      })
      .then((allowance) => {
        assert.equal(
          allowance.toNumber(),
          100,
          "allowance equals the amount of allowance alloted for delegated transfer"
        );
      });
  });

  it("allows delegated transfer in valid scenario only", () => {
    return STCToken.deployed()
      .then(async (i) => {
        tokenInstance = i;
        fromAccount = accounts[2];
        toAccount = accounts[3];
        spendingAccount = accounts[4];

        await tokenInstance.transfer(fromAccount, 100);
        receipt = await tokenInstance.approve(spendingAccount, 10, {
          from: fromAccount,
        }); // approving delegated transfers upto 100 STC

        return tokenInstance.transferFrom(fromAccount, toAccount, 10000, {
          from: spendingAccount,
        });
      })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.toString().indexOf("revert") >= 0,
          "from account should have enough balance to do delegated transfer"
        );
        return tokenInstance.transferFrom(fromAccount, toAccount, 9999, {
          from: spendingAccount,
        });
      })
      .then(assert.fail)
      .catch(async (error) => {
        assert(
          error.toString().indexOf("revert") >= 0,
          "cannot transfer value larger than allowance"
        );

        await tokenInstance.transferFrom(fromAccount, toAccount, 4, {
          from: spendingAccount,
        });

        assert(
          (await tokenInstance.balanceOf(fromAccount)).toNumber() === 96,
          "tokens get deducted after delegated transfer from source"
        );
        assert(
          (await tokenInstance.balanceOf(toAccount)).toNumber() === 4,
          "tokens get added after delegated transfer to destination account"
        );
        assert(
          (
            await tokenInstance.allowance(fromAccount, spendingAccount)
          ).toNumber() === 6,
          "tokens allowance gets reduced after delegated transfer from spender account"
        );
      });
  });
});
