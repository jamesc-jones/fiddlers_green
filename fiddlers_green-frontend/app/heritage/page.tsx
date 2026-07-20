import ChapterSection from "@/components/heritage/ChapterSection";
import CovenantChain from "@/components/heritage/CovenantChain";
import HeritageDivider from "@/components/heritage/HeritageDivider";
import HeritageHero from "@/components/heritage/HeritageHero";
import HeritageTimeline from "@/components/heritage/HeritageTimeline";
import TwoRowWampum from "@/components/heritage/TwoRowWampum";
import TyendinagaHistory from "@/components/heritage/TyendinagaHistory";

export default function HeritagePage() {
  return (
    <main className="min-h-screen">
      <HeritageHero />
      <HeritageDivider />
      <ChapterSection label="I — The Belt">
        <TwoRowWampum />
      </ChapterSection>
      <HeritageDivider />
      <ChapterSection label="II — The Chain">
        <CovenantChain />
      </ChapterSection>
      <HeritageDivider />
      <ChapterSection label="III — The Land">
        <TyendinagaHistory />
      </ChapterSection>
      <HeritageDivider />
      <ChapterSection label="IV — The Timeline">
        <HeritageTimeline />
      </ChapterSection>
    </main>
  );
}