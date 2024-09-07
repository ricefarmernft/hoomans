module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log("deployer", deployer);
  await deploy("Hoomans", {
    from: deployer,
    args: [
      "0x2b76e341ca0b849ea770f365cf79f2bd8048257f57992b42d9cfe3204827c6b2", // WL Merkle Root
      "0xfc2a536c8e0af110e891db9cae48c50aec54be9464903ce616fc86afa2cda09a", // FCFS Merkle Root
      "0x7CE4FA787582C9e5c9fEe9F1B6803Fd794359A69", // Initial Owner
    ],
    log: true,
  });
};

exports.tags = ["Hoomans"];
