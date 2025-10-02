// pages/dashboard/index.js
import Layout from "../../components/Dashboard/Layout";
import OverviewPanel from "../../components/Dashboard/OverviewPanel";

export default function Dashboard() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold text-black mb-6">Dashboard Overview</h1>
      <OverviewPanel />
    </Layout>
  );
}
