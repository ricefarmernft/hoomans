module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log("deployer", deployer);
  await deploy("Hoomans", {
    from: deployer,
    args: [
      "0x47821b489d33cda7386f4f362d4c30c5ecb59eee0f3431408f529ef315b08174",
      "0x8481e1820c7bcb6b9e34f026e9140df3ff228d6480e88704b820d53a6cffb5be",
      "0x7CE4FA787582C9e5c9fEe9F1B6803Fd794359A69",
    ],
    log: true,
  });
};

exports.tags = ["Hoomans"];
