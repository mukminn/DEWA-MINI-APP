'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { isAddress, formatEther, parseEther } from 'viem';
import { base } from 'wagmi/chains';
import { ERC721_ABI } from '@/lib/contracts';
import { GlowCard } from './GlowCard';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export function MintNFTCard() {
  const { address } = useAccount();
  const [nftAddress, setNftAddress] = useState('');
  const [mintFee, setMintFee] = useState<bigint | null>(null);
  const [manualFee, setManualFee] = useState('');
  const [useManualFee, setUseManualFee] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [mintFunction, setMintFunction] = useState<'safeMint' | 'mint'>('safeMint');
  const [useFeeAsParam, setUseFeeAsParam] = useState(false);
  const [autoDetectMode, setAutoDetectMode] = useState(true);
  const [detectedMethod, setDetectedMethod] = useState<string>('');
  const [contractInfo, setContractInfo] = useState<{
    mintFee?: bigint;
    fee?: bigint;
    mintPrice?: bigint;
    publicMintPrice?: bigint;
  }>({});

  const { writeContract, data: hash, isPending } = useWriteContract();
  const publicClient = usePublicClient();

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

  // Calculate the fee that will be used
  const getFeeToUse = (): bigint | undefined => {
    if (useManualFee && manualFee) {
      const feeAmount = parseFloat(manualFee);
      if (feeAmount > 0) {
        try {
          return parseEther(manualFee);
        } catch (e) {
          return undefined;
        }
      }
    } else if (mintFee && mintFee > 0n) {
      return mintFee;
    }
    return undefined;
  };

  const feeToUse = getFeeToUse();

  const handleMint = async () => {
    if (!address) {
      toast.error('Please connect wallet');
      return;
    }

    if (!isAddress(nftAddress)) {
      toast.error('Invalid NFT contract address');
      return;
    }

    // Validate manual fee if enabled
    if (useManualFee && manualFee) {
      const feeAmount = parseFloat(manualFee);
      if (isNaN(feeAmount) || feeAmount < 0) {
        toast.error('Invalid fee amount');
        return;
      }
    }

    const tryMint = async () => {
      // Build list of methods to try - prioritize methods with fee if fee is provided
      const methodsToTry: Array<{ func: string; args: any[]; value: bigint | undefined; label: string }> = [];
      
      if (autoDetectMode) {
        if (feeToUse && feeToUse > 0n) {
          // If fee is provided, try methods with fee first (most likely needed)
          methodsToTry.push(
            { func: 'mint', args: [address, feeToUse], value: undefined, label: 'mint(address, fee) with fee param' },
            { func: 'safeMint', args: [address, feeToUse], value: undefined, label: 'safeMint(address, fee) with fee param' },
            { func: 'mint', args: [address], value: feeToUse, label: 'mint(address) with ETH value' },
            { func: 'safeMint', args: [address], value: feeToUse, label: 'safeMint(address) with ETH value' }
          );
        }
        // Also try without fee (in case fee is optional)
        methodsToTry.push(
          { func: 'mint', args: [address], value: undefined, label: 'mint(address) without fee' },
          { func: 'safeMint', args: [address], value: undefined, label: 'safeMint(address) without fee' }
        );
      } else {
        // Manual mode
        if (useFeeAsParam && feeToUse && feeToUse > 0n) {
          methodsToTry.push({ func: mintFunction, args: [address, feeToUse], value: undefined, label: `${mintFunction}(address, fee)` });
        } else {
          methodsToTry.push({ func: mintFunction, args: [address], value: feeToUse, label: `${mintFunction}(address) with ETH value` });
        }
      }

      let workingMethod: typeof methodsToTry[0] | null = null;
      const errors: string[] = [];
      let simulationWorked = false;

      // Test each method using simulateContract (skip if simulation always fails due to on-chain conditions)
      // Note: We'll still try to simulate but if all fail, we proceed with most likely method
      for (const method of methodsToTry) {
        try {
          await publicClient.simulateContract({
            address: nftAddress as `0x${string}`,
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
          // Continue to next method if simulation fails
          const errMsg = simErr?.shortMessage || simErr?.message || 'Unknown error';
          errors.push(`${method.label}: ${errMsg}`);
          console.log(`Method ${method.label} simulation failed:`, errMsg);
          
          // If error is about permission/execution, simulation might fail but transaction could work
          // So we still track this as potential working method if it's the first/likely one
          if (!workingMethod && (errMsg.includes('execution reverted') || errMsg.includes('revert'))) {
            // This might work on actual execution, so we keep it as potential
            workingMethod = method;
          }
          continue;
        }
      }

      // If no method passed simulation completely, use the first method with fee (if fee provided) or first method
      if (!simulationWorked) {
        console.warn('Simulation failed for all methods, will try direct execution with most likely method');
        console.log('Simulation errors:', errors);
        
        // Prioritize method with fee as parameter if fee is provided (most common pattern)
        if (feeToUse && feeToUse > 0n) {
          // Try mint(address, fee) first as it's the most common pattern for contracts with fee
          workingMethod = methodsToTry.find(m => m.func === 'mint' && m.args.length === 2 && m.args[1] === feeToUse) 
            || { func: 'mint', args: [address, feeToUse], value: undefined, label: 'mint(address, fee) with fee param (direct exec)' };
        } else {
          // Use first method from list
          workingMethod = methodsToTry[0] || { func: 'mint', args: [address], value: undefined, label: 'mint(address) without fee (direct exec)' };
        }
      }

      // Use the working method - ensure fee is correctly applied
      const txConfig: any = {
        address: nftAddress as `0x${string}`,
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
      console.log('Executing mint with config:', {
        functionName: workingMethod.func,
        args: workingMethod.args,
        value: workingMethod.value ? formatEther(workingMethod.value) : '0',
        feeToUse: feeToUse ? formatEther(feeToUse) : '0',
        useManualFee,
        manualFee,
      });

      writeContract(txConfig);
      
      if (autoDetectMode) {
        setDetectedMethod(workingMethod.label);
        const feeDisplay = feeToUse && feeToUse > 0n ? ` (Fee: ${formatEther(feeToUse)} ETH)` : '';
        if (workingMethod.label.includes('fallback')) {
          toast.success(`Using fallback method: ${workingMethod.label}${feeDisplay}`, { duration: 5000 });
        } else {
          toast.success(`Using: ${workingMethod.label}${feeDisplay}`);
        }
      } else {
        const feeDisplay = feeToUse && feeToUse > 0n ? ` (Fee: ${formatEther(feeToUse)} ETH)` : '';
        toast.success(`NFT mint transaction sent!${feeDisplay}`);
      }
    };

    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      await tryMint();
    } catch (error: any) {
      // Extract error message
      let errorMsg = 'Mint failed';
      
      // Try to get detailed error message
      const errorString = JSON.stringify(error, null, 2);
      console.error('Full error:', error);
      
      if (error?.cause?.reason) {
        errorMsg = error.cause.reason;
      } else if (error?.cause?.message) {
        errorMsg = error.cause.message;
      } else if (error?.shortMessage) {
        errorMsg = error.shortMessage;
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      
      // Show specific guidance for common errors
      if (errorMsg.includes('#1002') || errorMsg.includes('1002')) {
        errorMsg = `Error #1002: Contract rejected. Pastikan Anda adalah owner atau cek requirements contract. Fee: ${feeToUse ? formatEther(feeToUse) : '0'} ETH`;
      } else if (errorMsg.includes('reverted')) {
        errorMsg = `Transaction reverted. Coba ubah mint function atau pastikan fee sesuai dengan contract requirement.`;
      }
      
      toast.error(errorMsg, { duration: 5000 });
      console.error('Mint error details:', error);
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

                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-300">Fee to Use:</span>
                    <span className="text-lg font-bold text-glow-orange">
                      {useManualFee && manualFee
                        ? `${parseFloat(manualFee).toFixed(6)} ETH (Manual)`
                        : mintFee !== null && mintFee > 0n
                        ? `${formatEther(mintFee)} ETH (Auto)`
                        : '0 ETH'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useManualFee"
                checked={useManualFee}
                onChange={(e) => {
                  setUseManualFee(e.target.checked);
                  if (!e.target.checked) {
                    setManualFee('');
                  }
                }}
                className="w-4 h-4 rounded border-white/20 bg-black/40 text-glow-orange focus:ring-glow-orange focus:ring-2"
              />
              <label htmlFor="useManualFee" className="text-sm text-gray-400 cursor-pointer">
                Use Manual Fee
              </label>
            </div>
            
            {useManualFee && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <label className="block text-sm text-gray-400 mb-2">Manual Fee (ETH)</label>
                <input
                  type="number"
                  value={manualFee}
                  onChange={(e) => setManualFee(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  step="0.000000000000000001"
                  className="w-full px-4 py-3 bg-black/40 border border-glow-orange/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-glow-orange focus:glow-orange transition-all"
                />
              </motion.div>
            )}
          </div>

          {!showDetails && !useManualFee && mintFee !== null && mintFee > 0n && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-black/40 border border-glow-orange/50 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Mint Fee (Auto-detected):</span>
                <span className="text-lg font-bold text-glow-orange">
                  {formatEther(mintFee)} ETH
                </span>
              </div>
            </motion.div>
          )}

          {useManualFee && manualFee && parseFloat(manualFee) > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/40 border border-glow-orange rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Mint Fee (Manual):</span>
                <span className="text-lg font-bold text-glow-orange">
                  {parseFloat(manualFee).toFixed(6)} ETH
                </span>
              </div>
            </motion.div>
          )}

          {feeToUse !== undefined && feeToUse > 0n && isValidAddress && !autoDetectMode && (
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-black/20 rounded-lg p-2">
              <input
                type="checkbox"
                id="useFeeAsParam"
                checked={useFeeAsParam}
                onChange={(e) => setUseFeeAsParam(e.target.checked)}
                className="w-3 h-3 text-glow-orange"
              />
              <label htmlFor="useFeeAsParam" className="cursor-pointer">
                Gunakan fee sebagai parameter function ({mintFunction}(address, fee)) bukan sebagai value/ETH
              </label>
            </div>
          )}
          
          {!autoDetectMode && (
            <div className="flex items-center gap-4 text-xs text-gray-400 bg-black/20 rounded-lg p-2">
              <span>Mint Function:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mintFunction"
                  checked={mintFunction === 'safeMint'}
                  onChange={() => setMintFunction('safeMint')}
                  className="w-3 h-3 text-glow-orange"
                />
                <span>safeMint</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mintFunction"
                  checked={mintFunction === 'mint'}
                  onChange={() => setMintFunction('mint')}
                  className="w-3 h-3 text-glow-orange"
                />
                <span>mint</span>
              </label>
            </div>
          )}
        </div>

        {feeToUse !== undefined && feeToUse > 0n && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 border border-glow-orange rounded-xl p-3 mt-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Fee akan dikirim:</span>
              <span className="text-base font-bold text-glow-orange">
                {formatEther(feeToUse)} ETH
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {useManualFee ? '(Manual)' : '(Auto-detected)'}
            </div>
          </motion.div>
        )}

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

