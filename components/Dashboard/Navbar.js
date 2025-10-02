// components/Dashboard/Navbar.js
import { useRouter } from "next/router";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    // Clear any auth tokens/session here
    router.push("/"); // redirect to login
  };

  return (
    <div className="flex justify-end items-center p-4 bg-white shadow border-b">
      <span className="mr-4 text-black font-medium">Welcome, Staff</span>
      <button
        onClick={handleLogout}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
      >
        Logout
      </button>
    </div>
  );
}
