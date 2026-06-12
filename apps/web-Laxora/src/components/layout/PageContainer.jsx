export function PageContainer({ children }) {
  return (
    <main className="mx-auto min-w-0 w-full max-w-7xl overflow-x-hidden px-4 py-5 pb-28 sm:py-6 lg:px-8 lg:pb-8" id="main-content">
      {children}
    </main>
  );
}
