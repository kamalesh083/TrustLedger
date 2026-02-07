import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import "@rainbow-me/rainbowkit/styles.css";

import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

const config = getDefaultConfig({
  appName: "TrustLedger",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [sepolia],
  ssr: false,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#ffffff",
            accentColorForeground: "#0b1220",
            borderRadius: "large",
            overlayBlur: "small",
          })}
          modalSize="compact"
        >
          <RouterProvider router={router} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
