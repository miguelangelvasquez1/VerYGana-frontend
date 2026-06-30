export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-425 mx-auto">
        {children}
      </div>
    </div>
  );
}
