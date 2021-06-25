const STCToken = artifacts.require("STCToken");

module.exports = function (deployer) {
  deployer.deploy(STCToken, 1000000);
};
