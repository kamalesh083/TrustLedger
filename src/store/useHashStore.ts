import { create } from "zustand";

export type Mode = "strict" | "content";

type State = {
  mode: Mode;
  fileName: string;
  fileHash: string;
  contentHash: string;
  setMode: (m: Mode) => void;
  setFileName: (n: string) => void;
  setFileHash: (h: string) => void;
  setContentHash: (h: string) => void;
  reset: () => void;
};

export const useHashStore = create<State>((set) => ({
  mode: "strict",
  fileName: "",
  fileHash: "",
  contentHash: "",
  setMode: (mode) => set({ mode }),
  setFileName: (fileName) => set({ fileName }),
  setFileHash: (fileHash) => set({ fileHash }),
  setContentHash: (contentHash) => set({ contentHash }),
  reset: () => set({ fileName: "", fileHash: "", contentHash: "" }),
}));

export function useSelectedHash() {
  const { mode, fileHash, contentHash } = useHashStore();
  return mode === "strict" ? fileHash : contentHash;
}
