import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { walletConnect, injected } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo';

export const config = createConfig({
  chains: [base],
  connectors: [
    injected({ target: 'metaMask' }),
    injected(),
    walletConnect({
      projectId,
      metadata: {
        name: 'DEWA Web3 DApp',
        description: 'Futuristic Web3 DApp',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: [],
      },
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}

