'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { isAddress, formatEther } from 'viem';
import { base } from 'wagmi/chains';
import { ERC721_ABI } from '@/lib/contracts';
import { GlowCard } from './GlowCard';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export function MintNFTCard() {
  const { address } = useAccount();
  const [nftAddress, setNftAddress] = useState('');
  const [mintFee, setMintFee] = useState<bigint | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [contractInfo, setContractInfo] = useState<{
    mintFee?: bigint;
    fee?: bigint;
    mintPrice?: bigint;
    publicMintPrice?: bigint;
  }>({});

  const { writeContract, data: hash, isPending } = useWriteContract();

  const isValidAddress = nftAddress && isAddress(nftAddress);
  const contractAddress = isValidAddress ? (nftAddress as `0x${string}`) : undefined;

  // Try to read various fee functions (try all in parallel, use first one that succeeds)
  const { data: feeData } = useReadContract({
    address: contractAddress,
    abi: ERC721_ABI,
    functionName: 'mintFee',
    chainId: base.id,
    query: {
      enabled: !!contractAddress,
      retry: false,
    },
  });

  const { data: feeData2 } = useReadContract({
    address: contractAddress,
    abi: ERC721_ABI,
    functionName: 'fee',
    chainId: base.id,
    query: {
      enabled: !!contractAddress,
      retry: false,
    },
  });

  const { data: priceData } = useReadContract({
    address: contractAddress,
    abi: ERC721_ABI,
    functionName: 'mintPrice',
    chainId: base.id,
    query: {
      enabled: !!contractAddress,
      retry: false,
    },
  });

  const { data: publicPriceData } = useReadContract({
    address: contractAddress,
    abi: ERC721_ABI,
    functionName: 'publicMintPrice',
    chainId: base.id,
    query: {
      enabled: !!contractAddress,
      retry: false,
    },
  });

  useEffect(() => {
    // Collect all fee data
    const info: typeof contractInfo = {};
    if (feeData) info.mintFee = feeData as bigint;
    if (feeData2) info.fee = feeData2 as bigint;
    if (priceData) info.mintPrice = priceData as bigint;
    if (publicPriceData) info.publicMintPrice = publicPriceData as bigint;
    
    setContractInfo(info);
    
    // Use the first fee that exists (priority: mintFee > fee > mintPrice > publicMintPrice)
    const fee = feeData || feeData2 || priceData || publicPriceData;
    setMintFee(fee as bigint | null);
  }, [feeData, feeData2, priceData, publicPriceData]);

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

    try {
      writeContract({
        address: nftAddress as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'safeMint',
        args: [address, ''],
        chainId: base.id,
        value: mintFee || undefined,
      });
      toast.success('NFT mint transaction sent!');
    } catch (error: any) {
      toast.error(error.message || 'Mint failed');
    }
  };

  return (
    <GlowCard glowColor="orange" className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex flex-col"
      >
        <div className="mb-4">
          <p className="text-xs font-semibold text-glow-orange mb-2 uppercase tracking-wider">only owner</p>
          <h2 className="text-2xl font-bold text-glow-orange">Mint NFT</h2>
        </div>
        
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

          {isValidAddress && (
            <motion.button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full py-2 bg-black/40 border border-white/20 rounded-xl text-white hover:border-glow-orange transition-all text-sm flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{showDetails ? 'Hide' : 'Show'} Contract Details</span>
              <motion.span
                animate={{ rotate: showDetails ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.span>
            </motion.button>
          )}

          <AnimatePresence>
            {showDetails && isValidAddress && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-black/40 border border-glow-orange/50 rounded-xl p-4 space-y-3 overflow-hidden"
              >
                <div className="text-xs font-semibold text-glow-orange uppercase tracking-wider mb-2">
                  Contract Information
                </div>
                
                {contractInfo.mintFee !== undefined && contractInfo.mintFee > 0n && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">mintFee():</span>
                    <span className="text-sm font-bold text-glow-orange">
                      {formatEther(contractInfo.mintFee)} ETH
                    </span>
                  </div>
                )}
                
                {contractInfo.fee !== undefined && contractInfo.fee > 0n && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">fee():</span>
                    <span className="text-sm font-bold text-glow-orange">
                      {formatEther(contractInfo.fee)} ETH
                    </span>
                  </div>
                )}
                
                {contractInfo.mintPrice !== undefined && contractInfo.mintPrice > 0n && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">mintPrice():</span>
                    <span className="text-sm font-bold text-glow-orange">
                      {formatEther(contractInfo.mintPrice)} ETH
                    </span>
                  </div>
                )}
                
                {contractInfo.publicMintPrice !== undefined && contractInfo.publicMintPrice > 0n && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">publicMintPrice():</span>
                    <span className="text-sm font-bold text-glow-orange">
                      {formatEther(contractInfo.publicMintPrice)} ETH
                    </span>
                  </div>
                )}

                {Object.keys(contractInfo).length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    No fee information found
                  </div>
                )}

                {mintFee !== null && mintFee > 0n && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-300">Selected Fee:</span>
                      <span className="text-lg font-bold text-glow-orange">
                        {formatEther(mintFee)} ETH
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!showDetails && mintFee !== null && mintFee > 0n && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-black/40 border border-glow-orange/50 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Mint Fee:</span>
                <span className="text-lg font-bold text-glow-orange">
                  {formatEther(mintFee)} ETH
                </span>
              </div>
            </motion.div>
          )}
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

