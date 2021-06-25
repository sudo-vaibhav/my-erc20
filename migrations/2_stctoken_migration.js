const STCToken = artifacts.require("STCToken");
const STCTokenSale = artifacts.require("STCTokenSale");

module.exports = function (deployer) {
  deployer.deploy(STCToken, 1000000).then(() => {
    return deployer.deploy(STCTokenSale, STCToken.address, Math.pow(10, 15));
  });
};
