# Voterly
This repository contains the smart contract (and some frontend) code for Voterly, a decentralized governance platform with multiparty delegation built with Cairo.

## Setting up the Frontend
Clone the repository to your local machine:
```git clone https://github.com/starknet-voterly/demo-repository.git```
Change into the frontend directory:
```cd frontend````
Install the dependencies using yarn:
```yarn install```
Start the development server using yarn:
```yarn dev```
This will start the development server and you can access the frontend at http://localhost:3000.

## Viewing the WARP Output
To view the WARP output of the smart contracts, you can go to the smart contracts folder and run the following commands:
```npx buidler run scripts/warp.js --network=<network>```
Replace <network> with the network you want to view the WARP output for (e.g. rinkeby).

The WARP output will be saved in the cairo and json format in the smart contracts folder.

Summary
Voterly lays the groundwork for multi-delegation in its purest and simplest form. In the future, we’ll look to introduce:

- An efficient way to have multiple votes running at one moment in time
- The ability to add quorums needed for a vote to pass
- Different voting logic for each custom situation
- Possible ways to allow for undelegation of power during a vote
- Upgraded Smart Contracts that allows for full interfaces

To learn more about our project and our inspiration to develop this, please see our notion: https://www.notion.so/VOTERLY-42c6b53eec7946adb2064ffc3606d84b.
