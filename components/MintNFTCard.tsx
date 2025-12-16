'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { base } from 'wagmi/chains';
import { ERC721_ABI } from '@/lib/contracts';
import { GlowCard } from './GlowCard';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Default NFT contract address and fee (permanent configuration)
// Contract: 0xe2E4CF20d33302CcA9a0483259BF9c08e194455b
// Fee: 0.00002 ETH (fixed, cannot be changed)
const NFT_CONTRACT_ADDRESS = '0xe2E4CF20d33302CcA9a0483259BF9c08e194455b' as `0x${string}`;
const FIXED_MINT_FEE = parseEther('0.00002'); // Default: 0.00002 ETH

export function MintNFTCard() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const publicClient = usePublicClient();
  const [detectedMethod, setDetectedMethod] = useState<string>('');

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId: base.id,
  });

  const handleMint = async () => {
    if (!address) {
      toast.error('Please connect wallet');
      return;
    }

    if (!publicClient) {
      toast.error('Public client not available');
      return;
    }

    // Use fixed fee for this contract
    const calculatedFee = FIXED_MINT_FEE;

    const tryMint = async () => {
      // Build list of methods to try - prioritize mint(address, fee) with fee as parameter
      const methodsToTry: Array<{ func: string; args: any[]; value: bigint | undefined; label: string }> = [
        { func: 'mint', args: [address, calculatedFee], value: undefined, label: 'mint(address, fee) with fee param' },
        { func: 'safeMint', args: [address, calculatedFee], value: undefined, label: 'safeMint(address, fee) with fee param' },
        { func: 'mint', args: [address], value: calculatedFee, label: 'mint(address) with ETH value' },
        { func: 'safeMint', args: [address], value: calculatedFee, label: 'safeMint(address) with ETH value' },
      ];

      let workingMethod: typeof methodsToTry[0] | null = null;
      const errors: string[] = [];
      let simulationWorked = false;

      // Test each method using simulateContract
      for (const method of methodsToTry) {
        try {
          await publicClient.simulateContract({
            address: NFT_CONTRACT_ADDRESS,
            abi: ERC721_ABI,
            functionName: method.func as any,
            args: method.args as any,
            value: method.value,
            account: address,
          });
          
          // If simulation succeeds, use this method
          workingMethod = method;
          simulationWorked = true;
          break;
        } catch (simErr: any) {
          const errMsg = simErr?.shortMessage || simErr?.message || 'Unknown error';
          errors.push(`${method.label}: ${errMsg}`);
          console.log(`Method ${method.label} simulation failed:`, errMsg);
          continue;
        }
      }

      // If no method passed simulation, use the first method (mint with fee as param)
      if (!simulationWorked || !workingMethod) {
        console.warn('All methods failed simulation, using mint(address, fee) as fallback');
        console.log('Simulation errors:', errors);
        workingMethod = { func: 'mint', args: [address, calculatedFee], value: undefined, label: 'mint(address, fee) with fee param (fallback)' };
      }

      // Use the working method
      const txConfig: any = {
        address: NFT_CONTRACT_ADDRESS,
        abi: ERC721_ABI,
        functionName: workingMethod.func,
        args: workingMethod.args,
        chainId: base.id,
      };

      // Apply value if method uses ETH value for fee
      if (workingMethod.value && workingMethod.value > 0n) {
        txConfig.value = workingMethod.value;
      }

      // Debug logging
      console.log('=== MINT EXECUTION DEBUG ===');
      console.log('Contract:', NFT_CONTRACT_ADDRESS);
      console.log('Fixed Fee:', formatEther(FIXED_MINT_FEE), 'ETH');
      console.log('Transaction Config:', {
        functionName: workingMethod.func,
        args: workingMethod.args,
        argsDetails: workingMethod.args.map((arg, idx) => ({
          index: idx,
          value: typeof arg === 'bigint' ? formatEther(arg) + ' ETH' : arg,
          type: typeof arg,
        })),
        value: workingMethod.value ? formatEther(workingMethod.value) + ' ETH' : '0 ETH',
      });
      console.log('=== END DEBUG ===');

      writeContract(txConfig);
      
      setDetectedMethod(workingMethod.label);
      toast.success(`Using: ${workingMethod.label} (Fee: ${formatEther(calculatedFee)} ETH)`);
    };

    try {
      await tryMint();
    } catch (error: any) {
      let errorMsg = 'Mint failed';
      
      if (error?.cause?.reason) {
        errorMsg = error.cause.reason;
      } else if (error?.cause?.message) {
        errorMsg = error.cause.message;
      } else if (error?.shortMessage) {
        errorMsg = error.shortMessage;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      if (errorMsg.includes('#1002') || errorMsg.includes('1002')) {
        errorMsg = `Error #1002: Contract rejected. Pastikan Anda adalah owner. Fee: ${formatEther(calculatedFee)} ETH`;
      }
      
      toast.error(errorMsg, { duration: 5000 });
      console.error('Mint error:', error);
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
              value={NFT_CONTRACT_ADDRESS}
              disabled
              className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Fixed contract address</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 border border-glow-orange rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Mint Fee:</span>
              <span className="text-lg font-bold text-glow-orange">
                {formatEther(FIXED_MINT_FEE)} ETH
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Fixed fee amount</p>
          </motion.div>

          {detectedMethod && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-black/40 border border-glow-orange/50 rounded-xl p-3"
            >
              <div className="text-xs text-gray-400 mb-1">Method:</div>
              <div className="text-sm font-bold text-glow-orange">{detectedMethod}</div>
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
