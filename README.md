# 🔐 TrustLedger  
### Blockchain-Based Content Verification System

TrustLedger is a decentralized web application that verifies the authenticity of digital files (PDFs, DOCX, Images, etc.) using blockchain technology.

Instead of trusting a central authority, the system stores a cryptographic hash of a file on the blockchain. Any future upload can be verified against the immutable on-chain record.

---

## 🚨 Problem Statement

Digital files can be easily modified and redistributed as “original”.

There is:
- No simple public verification system  
- Heavy dependence on centralized authorities  
- Risk of tampering without detection  

We need a **trustless, transparent, and immutable** verification system.

---

## 💡 Solution

TrustLedger:

1. Hashes the file locally using SHA-256.
2. Stores only the hash on the Ethereum blockchain.
3. Allows anyone to verify authenticity later.

If the hash matches → Authentic  
If the hash differs → Tampered  

---

# 🔥 Features

## 🔒 Strict Mode (Byte-Level Hashing)

- Hashes raw file bytes
- Even a 1-bit change produces a completely different hash
- Best for exact file validation

---

## 📄 Content Mode (Text-Based Hashing)

- Extracts readable content
- Normalizes text
- Hashes extracted content

Use case:
- Same document saved as PDF and DOCX
- Content identical → Same content hash

---

## 📂 Supported File Types

- PDF
- DOCX
- PNG / JPG
- Any binary file (Strict Mode)

---

## ⛓ Blockchain Integration

- Ethereum Sepolia Testnet
- Smart contract-based hash storage
- Immutable on-chain record
- Wallet authentication via MetaMask

---

## 🦊 Wallet Integration

- MetaMask support
- Sepolia network detection
- Automatic network switch
- Secure contract interaction

---

## 📲 QR Code Verification (Optional / Future)

- Generate QR containing hash + blockchain reference
- Scan to verify authenticity
- Useful for certificates, ID cards, legal documents

---

# 🛠 Tech Stack

## Frontend
- React (Vite)
- TypeScript
- Tailwind CSS
- Lucide Icons

## Web3
- wagmi
- RainbowKit
- ethers.js
- Ethereum Sepolia

## Cryptography
- Web Crypto API (SHA-256)

---

# 🏗 System Architecture

## Registration Flow

User Upload  
↓  
Generate SHA-256 Hash (Local)  
↓  
Connect Wallet  
↓  
Store Hash in Smart Contract  
↓  
Blockchain Record Created  

---

## Verification Flow

Upload File  
↓  
Generate Hash  
↓  
Fetch On-Chain Hash  
↓  
Compare  
↓  
Authentic / Tampered  

---

# 📂 Project Structure

```
src/
 ├── components/
 │    ├── UploadDropzone.tsx
 │    ├── Navbar.tsx
 │
 ├── pages/
 │    ├── RegisterPage.tsx
 │    ├── VerifyPage.tsx
 │
 ├── lib/
 │    ├── hashFile.ts
 │    ├── contentHash.ts
 │    ├── contract.ts
 │
 ├── App.tsx
 └── main.tsx
```

---

# ⚙️ Installation & Setup

## Clone Repository

```bash
git clone https://github.com/your-username/trustledger.git
cd trustledger
```

## Install Dependencies

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

---

# ⛓ Smart Contract Setup

1. Deploy contract on Sepolia
2. Copy ABI
3. Paste ABI into:

```
src/lib/contract.ts
```

4. Add deployed contract address
5. Connect wallet

---

# 🔍 How Hashing Works

```ts
crypto.subtle.digest("SHA-256", fileBuffer)
```

Why SHA-256?

- 256-bit fingerprint
- Collision resistant
- One-way function
- Extremely sensitive to changes

Even a single character modification produces a completely different hash.

---

# 🎯 Real-World Applications

- University Certificates
- Government Documents
- Legal Contracts
- Corporate Agreements
- Media Authenticity Verification
- Fake News Prevention

---

# 🔐 Security Design

- Files are hashed locally
- Files are NOT uploaded to blockchain
- Only hash is stored
- No centralized server required
- Immutable verification

---

# 📈 Advantages

- Decentralized
- Immutable
- Transparent
- Trustless
- Low gas usage
- Privacy friendly

---

# 📜 License

MIT License
