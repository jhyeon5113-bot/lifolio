import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background pb-28 md:pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
