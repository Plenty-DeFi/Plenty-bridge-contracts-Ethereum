var WrapMultisig = artifacts.require("./WrapMultisig.sol");

module.exports = function(deployer) {
    return deployer.deploy(WrapMultisig);
};
