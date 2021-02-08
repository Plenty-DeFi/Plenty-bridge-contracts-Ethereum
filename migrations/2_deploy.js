const WrapMultisig = artifacts.require("./WrapMultisig.sol");
const configuration = require('../configuration');

module.exports = function(deployer, network, accounts) {
    return deployer.deploy(WrapMultisig, configuration.administrator(accounts)[network]);
};
