// src/app/dashboard/layout.tsx
import MainLayout from "@/components/layout/MainLayout";
import RouteGuard from "@/components/RouteGuard";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout>
      <RouteGuard>{children}</RouteGuard>
    </MainLayout>
  );
}