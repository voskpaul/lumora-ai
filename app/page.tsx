import Navbar from "@/components/marketing/navbar";
import HeroSection from "@/components/marketing/hero-section";
import TrustedBy from "@/components/marketing/trusted-by";
import FeaturesSection from "@/components/marketing/features-section";
import AIWorkflow from "@/components/marketing/ai-workflow";
import DashboardPreview from "@/components/marketing/dashboard-preview";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      <Navbar />
      <HeroSection />
      <TrustedBy />
      <FeaturesSection />
      <AIWorkflow />
      <DashboardPreview />
    </main>
  );
}