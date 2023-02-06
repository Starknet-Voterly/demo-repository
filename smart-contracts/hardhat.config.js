require("@nomicfoundation/hardhat-toolbox");
require("@nethermindeth/hardhat-warp"); //comment out to use normal harhat (comment in to use starknet)
// TO RUN THE STARKNET DEVNET
//source venv/bin/activate
//starknet-devnet

// TO INSTALL THE STARKNET DEVNET
// env "CFLAGS=-I/usr/local/include -L/usr/local/lib" pip install starknet-devnet

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
  integratedDevnet: {
    url: `http://127.0.0.1:5050`,

    venv: "./venv",
    args: ["--seed", "0", "--timeout", "10000"],
    stdout: `stdout.log`, // <- logs redirected to log file
    stderr: "STDERR"  // <- logs stderr to the terminal
  },
},
};
