import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import { SmartContract, Address, ContractFunction } from '@multiversx/sdk-core';
import axios from 'axios';

const networkProvider = new ProxyNetworkProvider(
  'https://gateway.multiversx.com'
);
const saleContractAddress = 'erd1...your_sale_contract_address';
const TOKEN_ID = 'INDY-123456';

export class BlockchainService {
  async getTokenPrice(): Promise<number> {
    const contract = new SmartContract({
      address: new Address(saleContractAddress),
    });
    const query = contract.createQuery({
      func: new ContractFunction('getTokenPrice'),
      args: [],
    });
    const response = await networkProvider.queryContract(query);
    if (response.returnData && response.returnData.length > 0) {
      const priceBase64 = response.returnData[0];
      const priceHex = Buffer.from(priceBase64, 'base64').toString('hex');
      return Number(BigInt(`0x${priceHex}`).toString()) / 1e18;
    }
    return 0.000001;
  }

  async getTokensAvailable(): Promise<number> {
    const response = await axios.get(
      `https://api.multiversx.com/accounts/${saleContractAddress}/tokens/${TOKEN_ID}`
    );
    const balanceWei = BigInt(response.data.balance);
    return Number(balanceWei) / 1e18;
  }

  async getTotalBought(): Promise<number> {
    const contract = new SmartContract({
      address: new Address(saleContractAddress),
    });
    const query = contract.createQuery({
      func: new ContractFunction('getTotalBoughtAmountOfEsdt'),
      args: [],
    });
    const response = await networkProvider.queryContract(query);
    if (response.returnData && response.returnData.length > 0) {
      const totalBoughtBase64 = response.returnData[0];
      const totalBoughtHex = Buffer.from(totalBoughtBase64, 'base64').toString(
        'hex'
      );
      return Number(BigInt(`0x${totalBoughtHex}`).toString()) / 1e18;
    }
    return 0;
  }
}
