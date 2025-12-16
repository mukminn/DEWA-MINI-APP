'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, isAddress } from 'viem';
import { ERC20_ABI } from '@/lib/contracts';
import { GlowCard } from './GlowCard';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export function SendTokenCard() {
  const { address } = useAccount();
  const [tokenAddress, setTokenAddress] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [amount, setAmount] = useState('');

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSend = async () => {
    if (!address) {
      toast.error('Please connect wallet');
      return;
    }

    if (!isAddress(tokenAddress)) {
      toast.error('Invalid token address');
      return;
    }

    if (!isAddress(receiverAddress)) {
      toast.error('Invalid receiver address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Invalid amount');
      return;
    }

    try {
      const amountWei = parseEther(amount);
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [receiverAddress as `0x${string}`, amountWei],
      });
      toast.success('Transaction sent!');
    } catch (error: any) {
      toast.error(error.message || 'Transaction failed');
    }
  };

  return (
    <GlowCard glowColor="blue" className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex flex-col"
      >
        <h2 className="text-2xl font-bold text-glow-blue mb-4">Send Token</h2>
        
        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Token Address</label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-glow-blue focus:glow-blue transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Receiver Address</label>
            <input
              type="text"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-glow-blue focus:glow-blue transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.000000000000000001"
              className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-glow-blue focus:glow-blue transition-all"
            />
          </div>
        </div>

        <motion.button
          onClick={handleSend}
          disabled={isPending || isConfirming}
          className="mt-6 w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-bold text-white glow-blue disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isPending || isConfirming ? 1 : 1.05 }}
          whileTap={{ scale: isPending || isConfirming ? 1 : 0.95 }}
        >
          {isPending ? 'Sending...' : isConfirming ? 'Confirming...' : 'Send Token'}
        </motion.button>

        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 text-center text-green-400 font-bold"
          >
            Transaction successful! 🎉
          </motion.div>
        )}
      </motion.div>
    </GlowCard>
  );
}

