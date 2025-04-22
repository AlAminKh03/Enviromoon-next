"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Menu,
  Power,
  RefreshCcw,
  Settings,
} from "lucide-react";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState("connected");

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div
        className={cn(
          "bg-card border-r flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between">
          {!collapsed && <h2 className="font-semibold text-lg">EnviroMoon</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <Separator />

        {/* Device Status */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                deviceStatus === "connected" ? "bg-green-500" : "bg-red-500"
              )}
            />
            {!collapsed && (
              <span className="text-sm">
                {deviceStatus === "connected" ? "Connected" : "Disconnected"}
              </span>
            )}
          </div>
        </div>
        <Separator />

        {/* Navigation */}
        <nav className="flex-1">
          <div className="px-2 py-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              size={collapsed ? "icon" : "default"}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              {!collapsed && "Dashboard"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              size={collapsed ? "icon" : "default"}
            >
              <Settings className="h-4 w-4 mr-2" />
              {!collapsed && "Settings"}
            </Button>
          </div>
        </nav>

        {/* Device Controls */}
        <div className="p-4 space-y-2">
          <Separator />
          <Button
            variant="outline"
            className="w-full justify-start"
            size={collapsed ? "icon" : "default"}
          >
            <Power className="h-4 w-4 mr-2" />
            {!collapsed && "Restart Device"}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            size={collapsed ? "icon" : "default"}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            {!collapsed && "Refresh Connection"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="h-full p-8">{children}</div>
      </div>
    </div>
  );
}
