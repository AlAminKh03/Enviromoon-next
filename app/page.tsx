import { Layout } from "@/components/Layout";
import { SensorDashboard } from "@/components/SensorDashboard";

export default function Home() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time environmental monitoring system
          </p>
        </div>
        <SensorDashboard />
      </div>
    </Layout>
  );
}
