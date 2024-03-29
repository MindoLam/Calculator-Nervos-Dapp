/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';
import * as ERC20 from '../../build/contracts/ERC20.json'
import { AdditionSubtractionWrapper } from '../lib/contracts/AdditionSubtractionWrapper';
import { CONFIG } from '../config';


async function createWeb3() {
    // Modern dapp browsers...
    const {ethereum} = window as any;
    if (ethereum && ethereum.isMetaMask) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<AdditionSubtractionWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [storedValue, setStoredValue] = useState<number | undefined>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [depositAddress, setDepositAddress] = useState<string | undefined>();
    const [ckETHBalance, setckETHBalance] = useState<string>();
    const [layer2Address, setLayer2Address] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [newStoredNumberInputValue, setNewStoredNumberInputValue] = useState<
        number | undefined
    >();

    useEffect(() => {
        (async () => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));

            const _polyjuiceAddress = addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]);
            const ckETHContract = new web3.eth.Contract(
                ERC20.abi as never,
                CONFIG.CKETH_PROXY_CONTRACT);

            const balance = await ckETHContract.methods.balanceOf(_polyjuiceAddress).call({
                from: accounts?.[0]
            });
            setckETHBalance(balance);

            addressTranslator
            .getLayer2DepositAddress(web3, (window as any).ethereum.selectedAddress)
            .then(depositaddy => {
                setDepositAddress(depositaddy.addressString);
            })
        } else {
            setPolyjuiceAddress(undefined);
        }
    })();
    }, [accounts?.[0]]);


    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];


    async function deployContract() {
        const _contract = new AdditionSubtractionWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function showValue() {
        const value = await contract.showValue(account);
        toast('Successfully read latest stored value.', { type: 'success' });

        setStoredValue(value);
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new AdditionSubtractionWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setStoredValue(undefined);
    }

    async function clearValue() {
        const value = await contract.clearValue(account);
        toast('Successfully cleared the stored value.', { type: 'success' });

    }

    async function addNewValue() {
        try {
            setTransactionInProgress(true);
            await contract.addValue(newStoredNumberInputValue, account);
            toast(
                'Successfully added to the stored value. You can refresh the read value now manually.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function subNewValue() {
        try {
            setTransactionInProgress(true);
            await contract.subtractValue(newStoredNumberInputValue, account);
            toast(
                'Successfully subtracted the stored value. You can refresh the read value now manually.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function divideNewValue() {
        try {
            setTransactionInProgress(true);
            await contract.divideValue(newStoredNumberInputValue, account);
            toast(
                'Successfully divided the stored value. You can refresh the read value now manually.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function multiplyNewValue() {
        try {
            setTransactionInProgress(true);
            await contract.multiplyValue(newStoredNumberInputValue, account);
            toast(
                'Successfully multiplied the stored value. You can refresh the read value now manually.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            ckETH Balance: <b>{ckETHBalance ? (parseInt(ckETHBalance) / 1000000000000000000).toString() : <LoadingIndicator />} ckETH</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <br />
            <br />
            Layer 2 Deposit: <b> {depositAddress || ' - '}</b>
            <br />
            <hr />
            <p>
                Button below will allow the deployment of a smart contract that 
                will add and subtract.            </p>
            <button onClick={deployContract} disabled={!l2Balance}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputValue || !l2Balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <button onClick={showValue} disabled={!contract}>
                Show stored value
            </button>
            {storedValue ? <>&nbsp;&nbsp;Current stored value: {storedValue.toString()}</> : null}
            <br />
            <br />
            <input
                type="number"
                onChange={e => setNewStoredNumberInputValue(parseInt(e.target.value, 10))}
            />
            <button onClick={addNewValue} disabled={!contract}>
                Add to the stored value.
            </button>

            <input
                type="number"
                onChange={e => setNewStoredNumberInputValue(parseInt(e.target.value, 10))}
            />
            <button onClick={subNewValue} disabled={!contract}>
                Subtract stored value.
            </button>

            <input
                type="number"
                onChange={e => setNewStoredNumberInputValue(parseInt(e.target.value, 10))}
            />
            <button onClick={multiplyNewValue} disabled={!contract}>
                Multiply the stored value.
            </button>

            <input
                type="number"
                onChange={e => setNewStoredNumberInputValue(parseInt(e.target.value, 10))}
            />
            <button onClick={divideNewValue} disabled={!contract}>
                Divide the stored value.
            </button>
            <br />
            <br />
            <button onClick={clearValue} disabled={!contract}>
                Clear the stored value
            </button>
            <br />
            <br />
            Use this force brige here <a href="https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos?xchain-asset=0x0000000000000000000000000000000000000000"> Force Bridge </a>
            to transfer tokens to the layer 2. Input your layer 2 deposit address as the receipent.
            <ToastContainer />
        </div>
    );
}
