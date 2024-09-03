module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log("deployer", deployer);
  await deploy("Hoomans", {
    from: deployer,
    args: [
      "0x337ae93572023fe44c88c5fca4ea9e53eeefd971494d9463033d5c4dd787437f",
      "0x0391d218662af09b9122f8f1750b9eeb38bf4a8b0c29fe15ea763e352737bc5b",
      "0x7CE4FA787582C9e5c9fEe9F1B6803Fd794359A69",
    ],
    log: true,
  });
};

exports.tags = ["Hoomans"];
