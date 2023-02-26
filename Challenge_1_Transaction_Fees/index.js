// Import Solana web3 functionalities
const {
    Connection,
    PublicKey,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction
} = require("@solana/web3.js")

const DEMO_FROM_SECRET_KEY = new Uint8Array([
    160, 20, 189, 212, 129, 188, 171, 124, 20, 179, 80,
    27, 166, 17, 179, 198, 234, 36, 113, 87, 0, 46,
    186, 250, 152, 137, 244, 15, 86, 127, 77, 97, 170,
    44, 57, 126, 115, 253, 11, 60, 90, 36, 135, 177,
    185, 231, 46, 155, 62, 164, 128, 225, 101, 79, 69,
    101, 154, 24, 58, 214, 219, 238, 149, 86
]);

const transferSol = async () => {
    try {
        const connection = new Connection(clusterApiUrl("devnet"),"confirmed");
        const from = Keypair.fromSecretKey(DEMO_FROM_SECRET_KEY);

        const to = Keypair.generate();
        
        let fromWalletBalance = await connection.getBalance(
            new PublicKey(from.publicKey)
        );
        let toWalletBalance = await connection.getBalance(
            new PublicKey(to.publicKey)
        );
        console.log(`from Wallet balance: ${parseInt(fromWalletBalance) / LAMPORTS_PER_SOL} SOL`);
        console.log(`to Wallet balance: ${parseInt(toWalletBalance) / LAMPORTS_PER_SOL} SOL`);

        console.log("Airdropping some SOL to sender wallet!");
        const fromAirdropSignature = await connection.requestAirdrop(
            new PublicKey(from.publicKey),
            2*LAMPORTS_PER_SOL
        );

        let latestBlockHash = await connection.getLatestBlockhash();

        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: fromAirdropSignature
        })
        console.log("Airdropping 2 SOL to sender wallet successful");

        fromWalletBalance = await connection.getBalance(
            new PublicKey(from.publicKey)
        );
        toWalletBalance = await connection.getBalance(
            new PublicKey(to.publicKey)
        );
        console.log(`from Wallet balance: ${parseInt(fromWalletBalance) / LAMPORTS_PER_SOL} SOL`);
        console.log(`to Wallet balance: ${parseInt(toWalletBalance) / LAMPORTS_PER_SOL} SOL`);

        const halfBalance = parseInt(fromWalletBalance / 2);

        var transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey,
                toPubkey: to.publicKey,
                lamports: halfBalance 
            })
        );

        var signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [from]
        );
        console.log("signature is ",signature);

        fromWalletBalance = await connection.getBalance(
            new PublicKey(from.publicKey)
        );
        toWalletBalance = await connection.getBalance(
            new PublicKey(to.publicKey)
        );
        console.log(`from Wallet balance: ${parseInt(fromWalletBalance) / LAMPORTS_PER_SOL} SOL`);
        console.log(`to Wallet balance: ${parseInt(toWalletBalance) / LAMPORTS_PER_SOL} SOL`);
    } catch (e) {
        console.log(e);
    }
}

transferSol();
