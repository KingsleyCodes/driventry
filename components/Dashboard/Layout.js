// components/Dashboard/Layout.js
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-blue-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}
