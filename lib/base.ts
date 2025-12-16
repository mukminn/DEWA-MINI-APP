import { base } from 'viem/chains';

export const BASE_CHAIN = base;

export const BASE_RPC_URL = 'https://mainnet.base.org';

export const BASE_EXPLORER = 'https://basescan.org';

export const switchToBase = async (provider: any) => {
  if (!provider) return;
  
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${base.id.toString(16)}` }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${base.id.toString(16)}`,
              chainName: 'Base',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [BASE_RPC_URL],
              blockExplorerUrls: [BASE_EXPLORER],
            },
          ],
        });
      } catch (addError) {
        console.error('Failed to add Base network:', addError);
      }
    }
  }
};


