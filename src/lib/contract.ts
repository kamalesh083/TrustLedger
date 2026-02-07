/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserProvider, Contract } from "ethers";
import ABI from "../abi/ContentRegistry.json";

export const CONTRACT_ADDRESS = "0x84e0Cf4Fb0884585c21536299416C2250DFF452C"; // your deployed contract

export async function getSignerContract() {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  return new Contract(CONTRACT_ADDRESS, ABI, signer);
}

export async function getReadContract() {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new BrowserProvider((window as any).ethereum);
  return new Contract(CONTRACT_ADDRESS, ABI, provider);
}
