const ethers = require("ethers");
require('dotenv').config();

// RPC URL for Base network (Ensure this is correct)
const baseRpcUrl = "https://mainnet.base.org"; // Example RPC URL for Base
const provider = new ethers.JsonRpcProvider(baseRpcUrl);

// Wallet private key to sign transactions (never expose this key publicly)
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);

// Define the Minting Contract's Address and ABI
const contractAddress = process.env.CONTRACT_ADDRESS; // Replace with the actual minting contract address
const contractABI = [
    "function mint(address to, uint256 id, uint256 amount, uint256 nonce, uint256 day, bytes signature, bytes data) public payable"
];

// Create a contract instance
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// Utility function to create the message hash as the contract does
function createMessageHash(account, id, amount, nonce, day) {
    const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256", "uint256", "uint256"],
        [account, id, amount, nonce, day]
    );
    return ethers.solidityPackedKeccak256(
        ["string", "bytes32"],
        ["\x19Ethereum Signed Message:\n32", messageHash]
    );
}

async function mintToken() {
    try {
        const toAddress = process.env.TO_ADDRESS; // Replace with the recipient's address
        const tokenId = 4; // Example token ID, this should be the ID of the token you are minting
        const amount = 1; // Amount of tokens to mint
        const nonce = Math.floor(Math.random() * 1000000); // Unique nonce for the transaction
        const day = Math.floor(Date.now() / 86400000); // Current day in UNIX timestamp
        const data = "0x"; // Any additional data for the mint (can be empty)
        const mintFee = ethers.parseEther("0.00005"); // The minting fee

        // Generate the message hash as the contract does
        const messageHash = createMessageHash(toAddress, tokenId, amount, nonce, day);

        // Sign the message hash with your private key (this must be the key of the manager)
        const signature = await wallet.signMessage(ethers.hexlify(messageHash));

        // Call the mint function on the contract
        const tx = await contract.mint(
            toAddress, 
            tokenId, 
            amount, 
            nonce, 
            day, 
            signature, 
            data,
            { value: mintFee } // Send the fee with the transaction
        );

        console.log("Mint transaction sent:", tx.hash);

        // Wait for the transaction to be confirmed
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
    } catch (error) {
        console.error("Error minting token:", error);
    }
}

// Run function
mintToken();
