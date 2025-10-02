// components/Dashboard/Sidebar.js
import Link from "next/link";
import { useRouter } from "next/router";

export default function Sidebar() {
  const router = useRouter();

  const links = [
    { name: "Overview", href: "/dashboard" },
    { name: "Inventory", href: "/dashboard/inventory" },
    { name: "Transactions", href: "/dashboard/transactions" },
    { name: "Profile", href: "/dashboard/profile" },
  ];

  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-6 text-xl font-bold text-black border-b">Inventory App</div>
      <nav className="mt-6">
        {links.map((link) => (
          <Link
  key={link.href}
  href={link.href}
  className={`block px-6 py-3 text-black hover:bg-blue-100 ${
    router.pathname === link.href ? "bg-blue-200 font-semibold" : ""
  }`}
>
  {link.name}
</Link>
        ))}
      </nav>
    </div>
  );
}
