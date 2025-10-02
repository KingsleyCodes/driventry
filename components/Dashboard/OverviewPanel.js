// components/Dashboard/OverviewPanel.js
export default function OverviewPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white shadow rounded p-6 text-center">
        <h2 className="text-lg font-semibold text-black">Total Products</h2>
        <p className="text-2xl mt-2 font-bold text-black">120</p>
      </div>
      <div className="bg-white shadow rounded p-6 text-center">
        <h2 className="text-lg font-semibold text-black">Sales Today</h2>
        <p className="text-2xl mt-2 font-bold text-black">$1,250</p>
      </div>
      <div className="bg-white shadow rounded p-6 text-center">
        <h2 className="text-lg font-semibold text-black">Low Stock Alerts</h2>
        <p className="text-2xl mt-2 font-bold text-black">5 Items</p>
      </div>
    </div>
  );
}
