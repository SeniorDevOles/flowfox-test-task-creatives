"use client";
import type { ReactNode } from "react";
import { ToastContainer } from "@/components/Toast";
import { NavigationHeader } from "@/components/NavigationHeader";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): React.ReactElement {
  return (
    <>
      <NavigationHeader />
      {children}
      <ToastContainer />
    </>
  );
}
