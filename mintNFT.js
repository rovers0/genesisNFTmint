const Web3 = require('web3');
const { abi, address } = require('./CheckInToken.json');  // ABI and address of your deployed contract
const web3 = new Web3('https://base-mainnet.org');  // Base RPC URL (use real Base URL if different)

// Manager wallet private key (Keep it secure)
const privateKey = 'YOUR_MANAGER_PRIVATE_KEY';

// Contract instance
const contract = new web3.eth.Contract(abi, address);

// Function to automatically mint an NFT
async function mintNFT(account, id, amount, nonce, signature) {
    const blockDay = Math.floor(Date.now() / 86400000); // Current day in UNIX timestamp (24 hours)

    // Prepare the message hash that needs to be signed
    const messageHash = web3.utils.soliditySha3(
        { t: 'address', v: account },
        { t: 'uint256', v: id },
        { t: 'uint256', v: amount },
        { t: 'uint256', v: nonce },
        { t: 'uint256', v: blockDay }
    );

    // Recover manager's address from the signature
    const recoveredAddress = await web3.eth.accounts.recover(messageHash, signature);

    // Ensure that the recovered address matches the manager's address
    if (recoveredAddress !== 'YOUR_MANAGER_ADDRESS') {
        throw new Error('Invalid signature');
    }

    // Construct the minting transaction
    const mintData = contract.methods.mint(account, id, amount, nonce, blockDay, signature, '0x').encodeABI();

    // Transaction setup
    const tx = {
        to: address,
        data: mintData,
        gas: 200000, // Estimated gas
        gasPrice: await web3.eth.getGasPrice(), // Dynamic gas price
    };

    // Sign the transaction with the manager's private key
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    // Send the signed transaction
    try {
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log('Minting successful!', receipt);
        return receipt;
    } catch (error) {
        console.error('Minting failed', error);
        throw error;
    }
}

// Example usage of mintNFT function
mintNFT('0xUserAddress', 1, 1, 12345, '0xSignatureHere')  // Replace with real data
    .then(receipt => {
        console.log('Minting complete:', receipt);
    })
    .catch(error => {
        console.error('Error minting NFT:', error);
    });
