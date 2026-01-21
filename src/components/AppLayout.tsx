import { Outlet } from "react-router-dom";
import FloatingParticles from "@/components/FloatingParticles";

export default function AppLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingParticles />
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}
