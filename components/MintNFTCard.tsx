'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { isAddress } from 'viem';
import { ERC721_ABI } from '@/lib/contracts';
import { GlowCard } from './GlowCard';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export function MintNFTCard() {
  const { address } = useAccount();
  const [nftAddress, setNftAddress] = useState('');
  const [tokenURI, setTokenURI] = useState('');
  const [preview, setPreview] = useState('');

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMint = async () => {
    if (!address) {
      toast.error('Please connect wallet');
      return;
    }

    if (!isAddress(nftAddress)) {
      toast.error('Invalid NFT contract address');
      return;
    }

    if (!tokenURI) {
      toast.error('Token URI is required');
      return;
    }

    try {
      writeContract({
        address: nftAddress as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'safeMint',
        args: [address, tokenURI],
      });
      toast.success('NFT mint transaction sent!');
    } catch (error: any) {
      toast.error(error.message || 'Mint failed');
    }
  };

  const loadPreview = () => {
    if (tokenURI) {
      setPreview(tokenURI);
    }
  };

  return (
    <GlowCard glowColor="orange" className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex flex-col"
      >
        <h2 className="text-2xl font-bold text-glow-orange mb-4">Mint NFT</h2>
        
        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-sm text-gray-400 mb-2">NFT Contract Address</label>
            <input
              type="text"
              value={nftAddress}
              onChange={(e) => setNftAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-glow-orange focus:glow-orange transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Token URI</label>
            <input
              type="text"
              value={tokenURI}
              onChange={(e) => setTokenURI(e.target.value)}
              placeholder="ipfs://... or https://..."
              className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-glow-orange focus:glow-orange transition-all"
            />
          </div>

          <button
            onClick={loadPreview}
            className="w-full py-2 bg-black/40 border border-white/20 rounded-xl text-white hover:border-glow-orange transition-all text-sm"
          >
            Load Preview
          </button>

          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-xl"
              >
                <div className="aspect-square bg-black/40 border border-white/20 rounded-xl overflow-hidden">
                  {preview.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={preview} alt="NFT Preview" className="w-full h-full object-cover" />
                  ) : preview.match(/\.(mp4|webm|mov)$/i) ? (
                    <video src={preview} className="w-full h-full object-cover" autoPlay loop muted />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Preview not available
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={handleMint}
          disabled={isPending || isConfirming}
          className="mt-6 w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-bold text-white glow-orange disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          whileHover={{ scale: isPending || isConfirming ? 1 : 1.05 }}
          whileTap={{ scale: isPending || isConfirming ? 1 : 0.95 }}
        >
          <motion.div
            className="absolute inset-0 bg-white/20"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'linear',
            }}
          />
          <span className="relative z-10">
            {isPending ? 'Minting...' : isConfirming ? 'Confirming...' : 'Mint NFT'}
          </span>
        </motion.button>

        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 text-center text-green-400 font-bold"
          >
            NFT minted successfully! 🎨
          </motion.div>
        )}
      </motion.div>
    </GlowCard>
  );
}

