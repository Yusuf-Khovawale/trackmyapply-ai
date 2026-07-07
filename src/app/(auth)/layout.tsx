export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="glass-card w-full max-w-sm p-8">{children}</div>
    </div>
  );
}
