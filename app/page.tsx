'use client';

import { ThreeBackground } from '@/components/ThreeBackground';
import { WalletButton } from '@/components/WalletButton';
import { SendTokenCard } from '@/components/SendTokenCard';
import { MintTokenCard } from '@/components/MintTokenCard';
import { BurnTokenCard } from '@/components/BurnTokenCard';
import { MintNFTCard } from '@/components/MintNFTCard';
import { MiniAppWrapper } from '@/components/MiniAppWrapper';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <MiniAppWrapper>
      <div className="min-h-screen relative">
        <ThreeBackground />
        
        <WalletButton />

        <main className="relative z-10 container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-4 gradient-animated bg-clip-text text-transparent">
              DEWA Web3
            </h1>
            <p className="text-xl text-gray-400">Futuristic DApp on Base</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SendTokenCard />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <MintTokenCard />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <BurnTokenCard />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <MintNFTCard />
            </motion.div>
          </div>
        </main>
      </div>
    </MiniAppWrapper>
  );
}

