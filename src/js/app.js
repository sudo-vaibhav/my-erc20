const App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  tokensAvailable: 750000,
  tokensSold: 0,
  tokenPrice: Math.pow(10, 15),
  init: () => {
    console.log(window.web3);
    App.initWeb3();
    document.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const tokens = parseInt(document.querySelector("#numberOfTokens").value);
      App.contracts.StcTokenSale.deployed().then((stcTokenSaleInstance) => {
        stcTokenSaleInstance
          .buyTokens(tokens, {
            from: App.account,
            value: App.tokenPrice * tokens,
          })
          .then((result) => {
            console.log("tokens bought: ", result);
          });
      });
    });
  },

  initWeb3: () => {
    if (typeof web3 !== "undefined") {
      console.log("hey: ", web3.currentProvider);
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      console.log("connecting to local blockchain");
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
      web3 = new Web3(web3.web3Provider);
    }

    return App.initContracts();
  },

  initContracts: () => {
    $.getJSON("STCTokenSale.json", (stcTokenSale) => {
      App.contracts.StcTokenSale = TruffleContract(stcTokenSale);
      App.contracts.StcTokenSale.setProvider(App.web3Provider);
      App.contracts.StcTokenSale.deployed().then((stcTokenSale) => {
        console.log(stcTokenSale.address);
        $.getJSON("STCToken.json", (stcToken) => {
          App.contracts.StcToken = TruffleContract(stcToken);
          App.contracts.StcToken.setProvider(App.web3Provider);
          App.contracts.StcToken.deployed().then((stcToken) => {
            console.log(stcToken.address);
            return App.render();
          });
        });
      });
    });
  },

  listenForEvents: () => {
    App.contracts.StcTokenSale.deployed().then((stcTokenSaleInstance) => {
      stcTokenSaleInstance.Sell(
        {},

        (error, event) => {
          console.log("event triggered: ", event);
          window.location.reload();
        }
      );
    });
  },
  render: () => {
    web3.eth.getCoinbase((err, account) => {
      if (err === null) {
        App.account = account;
        $("#account-address").html("Your Account: " + account);
      }
    });

    App.contracts.StcTokenSale.deployed()
      .then((instance) => {
        stcTokenSaleInstance = instance;
        return stcTokenSaleInstance.tokenPrice();
      })
      .then(async (price) => {
        App.tokenPrice = price.toNumber();
        $("#token-price").html(App.tokenPrice / Math.pow(10, 18));
        App.tokensSold = (await stcTokenSaleInstance.tokensSold()).toNumber();

        const stcTokenInstance = await App.contracts.StcToken.deployed();
        const balance = await stcTokenInstance.balanceOf(App.account);

        $("#progress").html(App.tokensSold + "/" + App.tokensAvailable);
        $("#stc-balance").html(balance.toNumber());
        $("#contract-address").html(stcTokenInstance.address);
        App.listenForEvents();
      });
  },
};

window.addEventListener("DOMContentLoaded", () => {
  App.init();
});
