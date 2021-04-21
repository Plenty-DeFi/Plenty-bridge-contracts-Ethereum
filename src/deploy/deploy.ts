import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {administrator} from '../../configuration';

const deploy: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment,
) {
    const { deployments, getNamedAccounts, getChainId } = hre;
    const { deployer } = await getNamedAccounts();
    const chainId = await getChainId();
    const { deploy } = deployments;

    await deploy("WrapMultisig", {
        from: deployer,
        args: [administrator(chainId)],
        log: true,
        proxy: false
    });
};

export default deploy;