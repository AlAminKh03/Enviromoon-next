import { Layout } from "@/components/Layout";
import { DeviceSettings } from "@/components/DeviceSettings";

export default function SettingsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your EnviroMoon device and sensors
          </p>
        </div>
        <DeviceSettings />
      </div>
    </Layout>
  );
}

