import {useContract} from './useContract';
import Extras from '../contracts/Extras.json';
import ExtrasContractAddress from '../contracts/ExtrasAddress.json';


// export interface for NFT contract
export const useMinterContract = () => useContract(Extras.abi, ExtrasContractAddress.Extras);