module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log("deployer", deployer);
  await deploy("Hoomans", {
    from: deployer,
    args: [
      "0x1fc087266e1fbfa704b4c6396539853f62b5cf94d78536be860fe54091713f85",
      "0xf0b3801a1a0e9b118ff13a53681727a2fdeaa4ffb5b017f92dfbd8043045f3e8",
      "0xc8fB0913A8E36487710F838a08D4E66367D07924",
    ],
    log: true,
  });
};

exports.tags = ["Hoomans"];
