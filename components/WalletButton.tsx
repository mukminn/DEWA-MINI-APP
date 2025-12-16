'use client';

import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { base } from 'wagmi/chains';
import { formatEther } from 'viem';

export function WalletButton() {
  const { address, isConnected, chainId: accountChainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({
    address,
    chainId: base.id,
  });

  useEffect(() => {
    if (isConnected && accountChainId && accountChainId !== base.id) {
      try {
        switchChain({ chainId: base.id });
      } catch (error) {
        console.error('Failed to switch to Base chain:', error);
      }
    }
  }, [isConnected, accountChainId, switchChain]);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const connectWallet = async () => {
    const metaMaskConnector = connectors.find((c) => c.id === 'io.metamask' || c.id === 'injected');
    const connector = metaMaskConnector || connectors[0];
    if (connector) {
      connect({ 
        connector,
        chainId: base.id,
      });
    }
  };

  return (
    <motion.div
      className="fixed top-6 right-6 z-50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <AnimatePresence mode="wait">
        {isConnected ? (
          <motion.div
            key="connected"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="glass-card-strong rounded-2xl p-4 glow-blue"
          >
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-glow-blue font-bold">{shortAddress}</div>
                {balance && (
                  <div className="text-xs text-gray-400">
                    {parseFloat(formatEther(balance.value)).toFixed(4)} ETH
                  </div>
                )}
              </div>
              <motion.button
                onClick={() => disconnect()}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl font-bold text-white hover:opacity-80 transition-opacity"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Disconnect
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="disconnected"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={connectWallet}
            className="gradient-animated px-8 py-4 rounded-2xl font-bold text-black glow-yellow"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Connect Wallet
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

