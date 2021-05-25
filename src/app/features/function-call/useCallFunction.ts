import { ethers, providers } from "ethers";
import abiDecoder from "abi-decoder";
import { SignatureLike } from '@ethersproject/bytes'
import { PopulatedTransaction } from '@ethersproject/contracts'
import { keccak256 } from '@ethersproject/keccak256'

import OutputLog from "../../containers/OutputLog";
import ContractAddress from "../../containers/ContractAddress";
import Contracts from "../../containers/Contracts";
import Signers from "../../containers/Signers";
import wallet from "../../containers/Connection";

import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
var Web3 = require('web3');
let library;


const useCallFunction = (args, types, fn, opts) => {
  const { addLogItem, addJSONLogItem } = OutputLog.useContainer();
  const { selectedContract } = Contracts.useContainer();
  const { address } = ContractAddress.useContainer();
  const { signer } = Signers.useContainer();
  
  const logEvents = async (tx) => {
    const receipt = await signer.provider.getTransactionReceipt(tx.hash);
    abiDecoder.addABI(selectedContract.abi);
    const decoded = abiDecoder.decodeLogs(receipt.logs);
    decoded.forEach((evt) => {
      const values = evt.events.map((x) => {
        if (x.type === "bytes32") {
          return ethers.utils.parseBytes32String(x.value);
        }
        return x.value;
      });
      addLogItem(`Event: ${evt.name}(${values})`);
    });
  };

  const callFunction = async () => {
    // handle array and int types
    const processedArgs = args.map((arg, idx) => {
      const type = types[idx];
      if (type.substring(0, 4) === "uint") return ethers.BigNumber.from(arg);
      if (type.slice(-2) === "[]") return JSON.parse(arg);
      return arg;
    });





    const instance = new ethers.Contract(address, selectedContract.abi, signer);
    var userAddress = await signer.getAddress();
    addLogItem(`Hello @thegostep`)

    //addLogItem(JSON.stringify(fn));

    if (fn.stateMutability !== "view" && fn.constant !== true) {


      if (wallet.name = 'MetaMask') {
        var method = "personal_sign";
      } else {
        var method = "eth_sign";
      }

      try {
        const estimateGas = await instance.estimateGas[fn.name](...processedArgs, opts);
        const gasLimitCalculated = await estimateGas;
        opts.gasLimit = gasLimitCalculated
        addLogItem(`Gas Estimate: ` + estimateGas);
      } catch (error) {
        addLogItem(`Gas could not be estimated`);
      }

      try {
        const estimateGasPrice = await signer.provider.getGasPrice();
        const gasPriceCalculated = await estimateGasPrice;
        opts.gasPrice = gasPriceCalculated
        addLogItem(`Gas Price: ` + gasPriceCalculated);
      } catch (error) {
        addLogItem(`Gas price could not be estimated`);
      }


      try {
        const getNonce = await signer.getTransactionCount();
        const getNoncePosition = await getNonce;
        opts.nonce = parseInt(JSON.stringify(getNoncePosition))
        addLogItem(`Nonce: ` + getNoncePosition);
      } catch (error) {
        addLogItem(`Nonce could not be retrieved`);
      }

     

        addLogItem(`signer: `+userAddress)
        addLogItem(`method: `+method)

          //addLogItem(`signer: `+JSON.stringify(signer))




              if (!(signer instanceof JsonRpcSigner)) {
                throw new Error(`Cannot sign transactions with this wallet type`)
              }

              //           // ethers will change eth_sign to personal_sign if it detects metamask
              // let web3Provider: Web3Provider | undefined
              // let isMetamask: boolean | undefined
              // if (library instanceof Web3Provider) {
              //   web3Provider = library as Web3Provider
              //   isMetamask = web3Provider.provider.isMetaMask
              //   web3Provider.provider.isMetaMask = false
              // }

              addLogItem(`here1`)
              addLogItem(JSON.stringify(processedArgs))

              let populatedResponse;
              let hash;
              let serialized;
              let messageFrom;

          const getSignature = await instance.populateTransaction[fn.name](...processedArgs, opts).then((response: PopulatedTransaction) => {
            
            messageFrom = response.from
            delete response.from
            //response.from = userAddress;
            response.chainId = 1
             serialized = ethers.utils.serializeTransaction(response)
             hash = keccak256(serialized)
             populatedResponse = response
            return populatedResponse;
          })

          addLogItem(`Populated Reply: `+JSON.stringify(populatedResponse))
          addLogItem(`From:` + messageFrom)
          addLogItem(`Serialized:` + JSON.stringify(serialized))
          addLogItem(`SIGNED1:` + JSON.stringify(getSignature))
          addLogItem(`Hash:` + hash)


          const addr = await signer.getAddress();
          addLogItem(`From2:` + addr)
          const getSignature2 = await signer.provider.send(method, [ethers.utils.hexlify(hash),addr.toLowerCase()])
            .then((signature: SignatureLike) => {
              //this returns the transaction & signature serialized and ready to broadcast
              const txWithSig = ethers.utils.serializeTransaction(populatedResponse, signature)
              return txWithSig
              // const hash = keccak256(txWithSig)
              // addTransaction({ hash }, {
              //   summary: 'Approve ' + amountToApprove.currency.symbol,
              //   approval: { tokenAddress: token.address, spender: spender }
              // })
            });

            addLogItem(`SIGNED2:` + JSON.stringify(getSignature2))




            // delete response.from
            // response.chainId = 1
            // const serialized = ethers.utils.serializeTransaction(response)
            // hash = keccak256(serialized)
            // return library
            // .jsonRpcFetchFunc(method, [signer, hash])
            //   .then((signature: SignatureLike) => {
            //     //this returns the transaction & signature serialized and ready to broadcast
            //     const txWithSig = ethers.utils.serializeTransaction(extResponse, signature)
            //     return txWithSig
            //     // const hash = keccak256(txWithSig)
            //     // addTransaction({ hash }, {
            //     //   summary: 'Approve ' + amountToApprove.currency.symbol,
            //     //   approval: { tokenAddress: token.address, spender: spender }
            //     // })
            //   }).finally(()=>{hash = ""
              
            //         if (web3Provider) {
            //           web3Provider.provider.isMetaMask = isMetamask
            //         }
            //       }
            //   )
            //     })
              


          

        // const tx = await instance[fn.name](...processedArgs, opts);



        // addLogItem(`tx.hash: ${tx.hash}`);
        // await tx.wait();
        // addLogItem(`tx mined: ${tx.hash}`);
        // await logEvents(tx);
      } else {
        // view fn
        const result = await instance[fn.name](...processedArgs);
        // simple return type
        if (!Array.isArray(result)) {
          addLogItem(result.toString());
          return;
        }

        // complex return type
        const processArray = (arr) => {
          let newArr = [];
          for (let i = 0; i < arr.length; i++) {
            const val = Array.isArray(arr[i])
              ? processArray(arr[i])
              : arr[i].toString();
            newArr.push(val);
          }
          return newArr;
        };

        let processed = processArray([...result]);

        addJSONLogItem(JSON.stringify(processed, null, 2));
      }
    };

    return { callFunction };
  };

  export default useCallFunction;
