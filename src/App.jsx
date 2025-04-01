import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CowSwapWidget, TradeType } from "@cowprotocol/widget-react";

/********************************************************************
 * TUTORIAL STEPS
 ********************************************************************/
const steps = [
  {
    title: "Step 1",
    description:
      'Select first the method of payment (in this case by credit card), then select the currency you want to purchase xDai with. Select xDai in the ‘You Get’ section, after that select the network you want to use (Gnosis chain by default) and then click "BUY XDAI".',
    image: "step1.jpg",
  },
  {
    title: "Step 2",
    description: "Enter your phone number and click next.",
    image: "step2.jpg",
  },
  {
    title: "Step 3",
    description:
      'Write your email address, mark the checkbox "I accept the T&C of Mt Pelerin" and click next.',
    image: "step3.jpg",
  },
  {
    title: "Step 4",
    description:
      "You will be registered to Mt Pelerin. They will tell you your transaction limits (OPTIONAL: upgrade by selecting 'Identity').",
    image: "step4.jpg",
  },
  {
    title: "Step 5",
    description: "Now connect your wallet in order to choose a receiving address.",
    image: "step5.jpg",
  },
  {
    title: "Step 6",
    description:
      "Choose the wallet address where you want to receive your funds. Mt Pelerin will display the chain. Click 'Validate this address' and then click Next.",
    image: "step6.jpg",
  },
  {
    title: "Step 7",
    description: 'Fill in your credit card information and click "BUY XDAI".',
    image: "step7.jpg",
  },
  {
    title: "Step 8",
    description: "Wait for confirmation.",
    image: "step8.jpg",
  },
  {
    title: "Step 9",
    description:
      'If payment is approved, it will display "Payment successful" and show transaction info.',
    image: "step9.jpg",
  },
];

/********************************************************************
 * COW SWAP PARAMS
 ********************************************************************/
const swapParams = {
  appCode: "xDai Onramp",
  width: "100%",
  height: "640px",
  chainId: 100,
  tokenLists: [
    "https://files.cow.fi/tokens/CoinGecko.json",
    "https://files.cow.fi/tokens/CowSwap.json",
  ],
  tradeType: TradeType.SWAP,
  sell: { asset: "xdai", amount: "0" },
  buy: { asset: "bzz", amount: "0" },
  forcedOrderDeadline: 1,
  enabledTradeTypes: [TradeType.SWAP],
  theme: "light",
  standaloneMode: true,
  disableToastMessages: false,
  disableProgressBar: false,
  hideBridgeInfo: true,
  hideOrdersTable: true,
  images: {},
  sounds: {},
  customTokens: [],
};

/********************************************************************
 * ADD BZZ BUTTON
 ********************************************************************/
function AddBzzButton() {
  // The official xBZZ address on Gnosis (as you provided):
  const BZZ_ADDRESS = "0xdBF3Ea6F5beE45c02255B2c26a16F300502F68da";

  async function addBZZtoWallet() {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: BZZ_ADDRESS,
            symbol: "BZZ",
            decimals: 18,
            // optional: link to a BZZ logo image
            image: "https://yourdomain.com/bzz-logo.png",
          },
        },
      });
    } catch (err) {
      console.error("Failed to add BZZ token:", err);
    }
  }

  return (
    <button
      onClick={addBZZtoWallet}
      className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition"
    >
      Add BZZ to Wallet
    </button>
  );
}

export default function App() {
  const provider = window.ethereum;

  /********************************************************************
   * STATE
   ********************************************************************/
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [widgetLoading, setWidgetLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  // Show a success popup if user connects their wallet:
  const [showConnectedPopup, setShowConnectedPopup] = useState(false);

  // === Light / Dark Mode ===
  // default to dark mode
  const [darkMode, setDarkMode] = useState(true);

  /********************************************************************
   * CHECK NETWORK ON LOAD
   ********************************************************************/
  useEffect(() => {
    async function checkNetwork() {
      if (provider && provider.request) {
        try {
          const chainId = await provider.request({ method: "eth_chainId" });
          if (chainId !== "0x64") {
            setWrongNetwork(true);
          }
        } catch (err) {
          console.error("Could not check network:", err);
        }
      }
    }
    checkNetwork();
  }, [provider]);

  /********************************************************************
   * SIMULATE LOADING (OR WAIT FOR WIDGET) WHEN ON CORRECT NETWORK
   ********************************************************************/
  useEffect(() => {
    if (!wrongNetwork) {
      // We'll show a spinner for ~1.5s to mimic the widget's load time
      const timer = setTimeout(() => setWidgetLoading(false), 4500);
      return () => clearTimeout(timer);
    } else {
      // If they switch back to a wrong network, re-enable loading
      setWidgetLoading(true);
    }
  }, [wrongNetwork]);

  /********************************************************************
   * LISTEN FOR ACCOUNTS CHANGED (WALLET CONNECT)
   ********************************************************************/
  useEffect(() => {
    if (provider && provider.on) {
      provider.on("accountsChanged", (accounts) => {
        if (accounts && accounts.length > 0) {
          // Show popup
          setShowConnectedPopup(true);
          // Hide popup automatically after 3s
          setTimeout(() => setShowConnectedPopup(false), 3000);
        }
      });
    }
  }, [provider]);

  /********************************************************************
   * SWITCH NETWORK FUNCTION
   ********************************************************************/
  const switchToGnosis = async () => {
    // Show the overlay
    setIsSwitching(true);

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x64" }],
      });
      setWrongNetwork(false);
      setIsSwitching(false); // Hide overlay on success
    } catch (switchError) {
      // If Gnosis is not added, we prompt to add it
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x64",
              chainName: "Gnosis Chain",
              nativeCurrency: {
                name: "xDAI",
                symbol: "xDAI",
                decimals: 18,
              },
              rpcUrls: ["https://rpc.gnosischain.com"],
              blockExplorerUrls: ["https://gnosisscan.io"],
            },
          ],
        });
        setWrongNetwork(false);
      } catch (addError) {
        console.error("Failed to add Gnosis Chain:", addError);
      }
      setIsSwitching(false); // Hide overlay even if error
    }
  };

  /********************************************************************
   * THEME TOGGLE HANDLER
   ********************************************************************/
  function toggleTheme() {
    setDarkMode((prev) => !prev);
  }

  /********************************************************************
   * RENDER UI
   ********************************************************************/
  // The container classes differ if darkMode is on or off:
  const containerClass = darkMode
    ? "dark bg-gray-900 text-white"
    : "bg-gray-100 text-black";

  return (
    <div
      className={`min-h-screen px-4 sm:px-8 py-10 relative transition-colors duration-300 ${containerClass}`}
    >
      {/* Overlay for network switching */}
      {isSwitching && (
        <div className="absolute inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Switching networks...</h2>
            <p className="mb-8">
              Please confirm the network switch in your wallet.
            </p>
            <div className="inline-block w-10 h-10 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Wallet Connected Popup */}
      {showConnectedPopup && (
        <div className="absolute right-5 top-5 bg-green-700 text-white px-4 py-3 rounded-md shadow-lg z-50 flex items-center space-x-2 animate-fadeIn">
          <span className="font-bold">Wallet connected successfully!</span>
        </div>
      )}

      {/* THEME TOGGLE BUTTON (top-right corner) */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded shadow"
      >
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>

      <div className="max-w-5xl mx-auto">
        {/* HERO SECTION */}
        <header className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold">xDai Onramp & Swap</h1>
          <p className="mt-2 text-lg">
            Buy xDai with your card. Swap it to xBZZ. All in one place.
          </p>
        </header>

        {/* STEP 1: BUY XDAI */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-green-500 dark:text-green-400">
            🪙 Step 1: Buy xDai
          </h2>
          <a
            href="https://widget.mtpelerin.com/?_ctkn=954139b2-ef3e-4914-82ea-33192d3f43d3&type=direct-link&tabs=buy,sell,swap&tab=buy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-500 text-white font-semibold py-3 px-6 rounded-2xl hover:bg-green-600 transition mb-8"
          >
            👉 Buy xDai on Mt Pelerin
          </a>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-2xl shadow-md mb-8 transition-colors duration-300`}
            >
              <h3
                className={`text-xl font-semibold mb-2 ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                {step.title}
              </h3>
              <p className="mb-4">{step.description}</p>
              <img
                src={step.image}
                alt={`Screenshot for ${step.title}`}
                className="w-full max-h-[450px] object-contain mx-auto rounded-lg"
              />
            </motion.div>
          ))}

          {/* FINAL CONGRATS */}
          <div
            className={`${
              darkMode ? "bg-green-800" : "bg-green-200"
            } p-6 rounded-xl border border-green-500 shadow-md text-center transition-colors duration-300`}
          >
            <h3 className="text-xl font-bold mb-2">🎉 Congratulations!</h3>
            <p>
              You now have successfully purchased xDai on Mt Pelerin. .
            </p>
          </div>
        </section>

        {/* STEP 2: SWAP TO XBZZ */}
        <section className="mb-16">
          <h2
            className={`text-2xl font-semibold mb-6 ${
              darkMode ? "text-purple-400" : "text-purple-600"
            }`}
          >
            🔄 Alreay Have Xdai? Swapp to Xbzz👇
          </h2>

          {wrongNetwork ? (
            <div
              className={`${
                darkMode ? "bg-red-200 text-red-800" : "bg-red-100 text-red-700"
              } p-4 rounded-lg mb-6 text-center`}
            >
              <p className="font-semibold">
                You are not connected to the Gnosis Chain.
              </p>
              <button
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={async () => {
                  setIsSwitching(true);
                  await switchToGnosis();
                }}
              >
                Switch to Gnosis
              </button>
            </div>
          ) : widgetLoading ? (
            // Show a loading spinner while the widget finishes mounting
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-2xl shadow-md text-center`}
            >
              <p className="mb-3">Loading the CoW Swap widget...</p>
              <div className="inline-block w-10 h-10 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-4 rounded-2xl shadow-md transition-colors duration-300`}
            >
              {/* The CoW Widget */}
              <CowSwapWidget params={swapParams} provider={provider} />

              {/* Add BZZ to Wallet Button */}
              <div className="mt-4 text-center">
                <AddBzzButton />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
