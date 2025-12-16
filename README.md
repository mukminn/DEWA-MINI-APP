# DEWA Web3 DApp

Futuristic Web3 DApp built on Base with ERC20 & ERC721 support.

## 🚀 Features

* **Send ERC20 Tokens** - Transfer tokens to any address
* **Mint ERC20 Tokens** - Create new tokens
* **Burn ERC20 Tokens** - Destroy tokens
* **Mint NFTs (ERC721)** - Create unique NFTs (owner-only for specific contract)
* **Base Mini App Ready** - Compatible with Base App & Farcaster Frames
* **3D Background** - Animated Three.js liquid mesh scene
* **Modern UI** - Glassmorphism cards with glow effects
* **Wallet Integration** - MetaMask & WalletConnect support

## 🛠 Tech Stack

* **Next.js 14** (App Router)
* **TypeScript**
* **Tailwind CSS** - Custom glow/neon theme
* **Framer Motion** - Smooth animations
* **Three.js** + **@react-three/fiber** + **@react-three/drei** - 3D graphics
* **wagmi** + **viem** - Ethereum interactions
* **WalletConnect** + **MetaMask** - Wallet connections
* **Base Mainnet** - Layer 2 blockchain

## 📦 Installation

```bash
npm install
```

## 🔧 Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

Get your WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)

## 🎮 Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗 Build

```bash
npm run build
npm start
```

## 🚀 Deploy

### GitHub Auto Push

```bash
npm run push-github
```

Set environment variables:

* `GITHUB_REPO` - Repository name (e.g., `username/repo`)
* `GITHUB_TOKEN` - GitHub personal access token

### Vercel Auto Deploy

```bash
npm run deploy-vercel
```

Set environment variables:

* `VERCEL_TOKEN` - Vercel access token
* `VERCEL_PROJECT_NAME` - Project name (optional)

Or use Vercel Dashboard:

1. Import GitHub repository
2. Auto-deploy on push

## 📱 Base Mini App / Farcaster

The app automatically detects mini app mode via:

* URL parameter: `?baseApp=true` or `?farcaster=true`
* User agent detection

## 🎨 Design

* **Colors**: Blue (#00d4ff), Yellow (#ffd700), Orange (#ff6b35), Red (#ff1744)
* **Effects**: Glow, neon, animated gradients, liquid animations
* **3D Scene**: Floating orbs, liquid mesh, particles
* **UI Cards**: Glassmorphism with 3D tilt on hover

## 📝 Notes

* **Mint NFT**: Currently configured for specific contract address `0xe2E4CF20d33302CcA9a0483259BF9c08e194455b` with fixed fee of `0.00002 ETH` (owner-only)
* **Base Chain**: All transactions default to Base chain
* **Fee Detection**: NFT minting uses auto-detection for the correct mint function

## 📄 License

MIT

## 🔗 Links

* [Base](https://base.org)
* [Wagmi](https://wagmi.sh)
* [Next.js](https://nextjs.org)

