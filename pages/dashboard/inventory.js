// pages/dashboard/inventory.js
import { useState } from "react";
import Layout from "../../components/Dashboard/Layout";
import InventoryTable from "../../components/Dashboard/InventoryTable";
import AddStockForm from "../../components/Dashboard/AddStockForm";

export default function InventoryPage() {
  const [products, setProducts] = useState([
    { name: "Sample Product", category: "Category A", stock: 10, price: 50 },
  ]);

  const handleAddProduct = (product) => {
    setProducts([product, ...products]);
    // Later, you will also save this to Firestore
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-black mb-6">Inventory</h1>
      <InventoryTable products={products} />
      <AddStockForm onAdd={handleAddProduct} />
    </Layout>
  );
}
