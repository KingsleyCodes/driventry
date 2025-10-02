// components/Dashboard/InventoryTable.js
export default function InventoryTable({ products }) {
  return (
    <div className="bg-white shadow rounded p-6">
      <h2 className="text-xl font-semibold text-black mb-4">Inventory</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-blue-100 text-black">
            <th className="p-2 border">Product Name</th>
            <th className="p-2 border">Category</th>
            <th className="p-2 border">Stock</th>
            <th className="p-2 border">Price</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center p-4 text-black">
                No products found
              </td>
            </tr>
          )}
          {products.map((product, index) => (
            <tr key={index} className="text-black">
              <td className="p-2 border">{product.name}</td>
              <td className="p-2 border">{product.category}</td>
              <td className="p-2 border">{product.stock}</td>
              <td className="p-2 border">${product.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
