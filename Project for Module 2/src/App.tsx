// import functionalities
import React from "react";
import "./App.css";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Transaction,
  LAMPORTS_PER_SOL,
  Keypair,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { useEffect, useState } from "react";

import * as buffer from "buffer";
window.Buffer = buffer.Buffer;

// create types
type DisplayEncoding = "utf8" | "hex";

type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

// create a provider interface (hint: think of this as an object) to store the Phantom Provider
interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

/**
 * @description gets Phantom provider, if it exists
 */
const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    // @ts-ignore
    const provider = window.solana as any;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};

function App() {
  // create state variable for the provider
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );

  // create state variable for the wallet key
  const [walletKey, setWalletKey] = useState<PhantomProvider | undefined>(
    undefined
  );

  // create state variable for newly created the wallet key
  const [newCreatedWalletKey, setNewCreatedWalletKey] = useState<
    Keypair | undefined
  >(undefined);

  // create state variable for newly created the wallet key
  const [newCreatedWalletBalance, setNewCreatedWalletKeyBalance] =
    useState<Number>(0);

  // this is the function that runs whenever the component updates (e.g. render, refresh)
  useEffect(() => {
    const provider = getProvider();

    // if the phantom provider exists, set this as the provider
    if (provider) setProvider(provider);
    else setProvider(undefined);
  }, []);

  const getWalletBalance = async () => {
    try {
      if (newCreatedWalletKey) {
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        // console.log("connecion object is ",connection);

        const walletBalance = await connection.getBalance(
          new PublicKey(newCreatedWalletKey.publicKey)
        );
        console.log(
          `wallet balance: ${
            parseInt(walletBalance.toString()) / LAMPORTS_PER_SOL
          } SOL`
        );
        setNewCreatedWalletKeyBalance(
          parseInt(walletBalance.toString()) / LAMPORTS_PER_SOL
        );
      } else {
        console.log("Create New Wallet Account first");
      }
    } catch (e) {
      console.log(e);
    }
  };

  /**
   * @description generates a new account on solana with airdroping 2 sols in it.
   * This function is called when the 'Create a new Solana account' button is clicked
   */
  const createNewSolanaAccount = async () => {
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

      // Generate new Keypair account
      const newAccount = Keypair.generate();

      setNewCreatedWalletKey(newAccount);
      // Aidrop 2 SOL to Sender wallet
      console.log(
        "Airdopping some SOL to " +
          new PublicKey(newAccount.publicKey).toString() +
          " wallet!"
      );
      const airDropSignature = await connection.requestAirdrop(
        new PublicKey(newAccount.publicKey),
        2 * LAMPORTS_PER_SOL
      );

      // Latest blockhash (unique identifer of the block) of the cluster
      let latestBlockHash = await connection.getLatestBlockhash();

      // Confirm transaction using the last valid block height (refers to its time)
      // to check for transaction expiration
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airDropSignature,
      });

      console.log(
        "Airdrop completed for the " +
          new PublicKey(newAccount.publicKey).toString() +
          " account"
      );
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * @description prompts user to connect wallet if it exists.
   * This function is called when the disconnect wallet button is clicked
   */
  const connectWallet = async () => {
    // @ts-ignore
    const { solana } = window;

    // checks if phantom wallet exists
    if (solana) {
      try {
        // connects wallet and returns response which includes the wallet public key
        const response = await solana.connect();
        console.log("wallet account ", response.publicKey.toString());
        // update walletKey to be the public key
        setWalletKey(response.publicKey.toString());
      } catch (err) {
        // { code: 4001, message: 'User rejected the request.' }
      }
    }
  };

  /**
   * @description prompts user to disconnect wallet.
   * This function is called when the disconnect wallet button is clicked
   */
  const disconnectWallet = async () => {
    // @ts-ignore
    const { solana } = window;

    // checks if phantom wallet exists
    if (solana) {
      try {
        // connects wallet and returns response which includes the wallet public key
        await solana.disconnect();
        // update walletKey to be the public key
        setWalletKey(undefined);
      } catch (err) {
        // { code: 4001, message: 'User rejected the request.' }
      }
    }
  };

  /**
   * @description generates a new account on solana with airdroping 2 sols in it.
   * This function is called when the 'Create a new Solana account' button is clicked
   */
  const transferSol = async () => {
    try {
      if (newCreatedWalletKey && walletKey) {
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

        // Send money from "from" wallet and into "to" wallet
        var transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: newCreatedWalletKey.publicKey,
            toPubkey: new PublicKey(walletKey),
            lamports: LAMPORTS_PER_SOL * 2,
          })
        );

        // Sign transaction
        var signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [newCreatedWalletKey]
        );
        console.log("Signature is ", signature);
      } else {
        console.log("newCreatedWalletKey or wallet connect issue");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // HTML code for the app
  return (
    <div className="App">
      <header className="App-header">
        <h2>Connect to Phantom Wallet</h2>
        {newCreatedWalletKey ? (
          <>
            <label>Balance is {`${newCreatedWalletBalance}`} SOL</label>
            <button
              style={{
                fontSize: "16px",
                padding: "15px",
                fontWeight: "bold",
                borderRadius: "5px",
              }}
              onClick={getWalletBalance}
            >
              Get Balance
            </button>
          </>
        ) : (
          <button
            style={{
              fontSize: "16px",
              padding: "15px",
              fontWeight: "bold",
              borderRadius: "5px",
            }}
            onClick={createNewSolanaAccount}
          >
            Create a new Solana account
          </button>
        )}
        {provider && !walletKey && (
          <button
            style={{
              fontSize: "16px",
              padding: "15px",
              fontWeight: "bold",
              borderRadius: "5px",
            }}
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        )}
        {provider && walletKey && (
          <div>
            <button
              className="disconnect-btn"
              style={{
                fontSize: "16px",
                padding: "15px",
                fontWeight: "bold",
                borderRadius: "5px",
              }}
              onClick={disconnectWallet}
            >
              Disconnect Wallet
            </button>
            <p>Connected Account Address: {`${walletKey}`}</p>
            {newCreatedWalletKey && (
              <button
                style={{
                  fontSize: "16px",
                  padding: "15px",
                  fontWeight: "bold",
                  borderRadius: "5px",
                }}
                onClick={transferSol}
              >
                Transfer Sol
              </button>
            )}
          </div>
        )}

        {!provider && (
          <p>
            No provider found. Install{" "}
            <a href="https://phantom.app/">Phantom Browser extension</a>
          </p>
        )}
      </header>
    </div>
  );
}

export default App;
