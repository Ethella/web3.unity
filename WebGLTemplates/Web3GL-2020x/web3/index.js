// load network.js to get network/chain id
document.body.appendChild(Object.assign(document.createElement("script"), { type: "text/javascript", src: "./network.js" }));
// load web3js to create transactions
document.body.appendChild(Object.assign(document.createElement("script"), { type: "text/javascript", src: "./web3/lib/web3.min.js" }));
// uncomment to enable torus wallet
// document.body.appendChild(Object.assign(document.createElement("script"), { type: "text/javascript", src: "https://unpkg.com/@toruslabs/torus-embed" }));
// uncomment to enable walletconnect
// document.body.appendChild(Object.assign(document.createElement("script"), { type: "text/javascript", src: "https://unpkg.com/@walletconnect/web3-provider@1.2.1/dist/umd/index.min.js" }));
// enable Magic Auth
document.body.appendChild(Object.assign(document.createElement("script"), { type: "text/javascript", src: "https://auth.magic.link/sdk" }));

// load web3gl to connect to unity
window.web3gl = {
  networkId: 0,
  connect,
  connectAccount: "",
  logout,
  signMessage,
  signMessageResponse: "",
  sendTransaction,
  sendTransactionResponse: "",
  sendContract,
  sendContractResponse: "",
};

// will be defined after connect()
let provider;
let web3;

/*
paste this in inspector to connect to wallet:
window.web3gl.connect()
*/
async function connect() {

  // set provider
  const magic = new Magic('YOUR_PUBLISHABLE_KEY');
  window.magic = magic;
  web3 = new Web3(magic.rpcProvider);

  await magic.auth.loginWithMagicLink({ email: 'jerry@magic.link' });

  // set current account
  const address = (await web3.eth.getAccounts())[0]
  web3gl.connectAccount = address;

  // Get user's balance in ether
  const balance = web3.utils.fromWei(
      await web3.eth.getBalance(address), // Balance is in wei
  );

  const metadata = await magic.user.getMetadata();

  console.log('email', metadata.email);
  console.log('address', address);
  console.log('balance', balance);
}

/*
paste this in inspector to connect to logout:
window.web3gl.logout()
*/
async function logout() {
  await window.magic.user.logout();
}

/*
paste this in inspector to connect to sign message:
window.web3gl.signMessage("hello")
*/
async function signMessage(message) {
  try {
    const from = (await web3.eth.getAccounts())[0];
    const signature = await web3.eth.personal.sign(message, from, "");
    window.web3gl.signMessageResponse = signature;
  } catch (error) {
    window.web3gl.signMessageResponse = error.message;
  }
}

/*
paste this in inspector to send eth:
const to = "0xdD4c825203f97984e7867F11eeCc813A036089D1"
const value = "12300000000000000"
const gasLimit = "21000" // gas limit
const gasPrice = "33333333333"
window.web3gl.sendTransaction(to, value, gasLimit, gasPrice);
*/
async function sendTransaction(to, value, gasLimit, gasPrice) {
  const from = (await web3.eth.getAccounts())[0];
  web3.eth
      .sendTransaction({
        from,
        to,
        value,
        gas: gasLimit ? gasLimit : undefined,
        gasPrice: gasPrice ? gasPrice : undefined,
      })
      .on("transactionHash", (transactionHash) => {
        window.web3gl.sendTransactionResponse = transactionHash;
      })
      .on("error", (error) => {
        window.web3gl.sendTransactionResponse = error.message;
      });
}

/*
paste this in inspector to connect to interact with contract:
const method = "increment"
const abi = `[ { "inputs": [], "name": "increment", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "x", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" } ]`;
const contract = "0xB6B8bB1e16A6F73f7078108538979336B9B7341C"
const args = "[]"
const value = "0"
const gasLimit = "222222" // gas limit
const gasPrice = "333333333333"
window.web3gl.sendContract(method, abi, contract, args, value, gasLimit, gasPrice)
*/
async function sendContract(method, abi, contract, args, value, gasLimit, gasPrice) {
  const from = (await web3.eth.getAccounts())[0];
  new web3.eth.Contract(JSON.parse(abi), contract).methods[method](...JSON.parse(args))
      .send({
        from,
        value,
        gas: gasLimit ? gasLimit : undefined,
        gasPrice: gasPrice ? gasPrice : undefined,
      })
      .on("transactionHash", (transactionHash) => {
        window.web3gl.sendContractResponse = transactionHash;
      })
      .on("error", (error) => {
        window.web3gl.sendContractResponse = error.message;
      });
}

// add new wallet to in metamask
async function addEthereumChain() {
  const account = (await web3.eth.getAccounts())[0];

  // fetch https://chainid.network/chains.json
  const response = await fetch("https://chainid.network/chains.json");
  const chains = await response.json();

  // find chain with network id
  const chain = chains.find((chain) => chain.chainId == window.web3ChainId);

  const params = {
    chainId: "0x" + chain.chainId.toString(16), // A 0x-prefixed hexadecimal string
    chainName: chain.name,
    nativeCurrency: {
      name: chain.nativeCurrency.name,
      symbol: chain.nativeCurrency.symbol, // 2-6 characters long
      decimals: chain.nativeCurrency.decimals,
    },
    rpcUrls: chain.rpc,
    blockExplorerUrls: [chain.explorers && chain.explorers.length > 0 && chain.explorers[0].url ? chain.explorers[0].url : chain.infoURL],
  };

  await window.ethereum
      .request({
        method: "wallet_addEthereumChain",
        params: [params, account],
      })
      .catch(() => {
        // I give up
        window.location.reload();
      });
}
