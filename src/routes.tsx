import { createBrowserRouter } from "react-router-dom";
import AppShell from "./AppShell";
import HashPage from "./pages/HashPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyPage from "./pages/VerifyPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HashPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/verify", element: <VerifyPage /> },
    ],
  },
]);
