import Navbar from './Navbar';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <Navbar />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
