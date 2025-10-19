# BorrowingVault Smart Contracts

## Quick Start - Secure Deployment

### 1. Import Your Wallet (One-time setup)
```bash
cast wallet import mezo-deployer --interactive
# Enter private key when prompted
# Set a strong password
```

### 2. Find BTC Token Address
Visit: https://explorer.test.mezo.org/
Search for "BTC" or "Wrapped Bitcoin"

### 3. Configure .env
```bash
cd /Users/pc/Tippinbit/contracts
nano .env
```

Add:
```
BTC_TOKEN_ADDRESS=0x[from_step_2]
MUSD_TOKEN_ADDRESS=0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
```

### 4. Deploy
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://rpc.test.mezo.org \
  --account mezo-deployer \
  --sender 0x9aabD891ab1FaA750FAE5aba9b55623c7F69fD58 \
  --broadcast \
  -vvvv
```

### 5. Update Frontend
Edit `../.env.local` with deployed vault address from step 4

### 6. Test
```bash
cd ../apps/web
npm run dev
```

---

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step guide.

---

## 🔐 Security

This project uses Foundry's encrypted keystore - your private key is NEVER stored in plaintext!

---

## Contract Info

- **Collateral Ratio:** 215.25%
- **Chain:** Mezo Testnet (31611)  
- **Wallet:** 0x9aabD891ab1FaA750FAE5aba9b55623c7F69fD58
- **Explorer:** https://explorer.test.mezo.org/
