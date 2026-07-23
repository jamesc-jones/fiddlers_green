import type { Metadata } from "next";
import ChapterSection from "@/components/heritage/ChapterSection";
import CovenantChain from "@/components/heritage/CovenantChain";
import HeritageDivider from "@/components/heritage/HeritageDivider";
import HeritageHero from "@/components/heritage/HeritageHero";
import HeritageTimeline from "@/components/heritage/HeritageTimeline";
import TwoRowWampum from "@/components/heritage/TwoRowWampum";
import TyendinagaHistory from "@/components/heritage/TyendinagaHistory";

export const metadata: Metadata = {
  title: "Heritage",
  description:
    "The story of Fiddler's Green — rooted in Tyendinaga, the Two Row Wampum, and the Haudenosaunee Covenant Chain.",
};

export default function HeritagePage() {
  return (
    <div className="min-h-screen">
      <HeritageHero />
      <HeritageDivider />
      <ChapterSection label="I — The Belt" className="max-w-6xl">
        <TwoRowWampum />
      </ChapterSection>
      <HeritageDivider />
      <ChapterSection label="II — The Chain">
        <CovenantChain />
      </ChapterSection>
      <HeritageDivider />
      <ChapterSection label="III — The Land" className="max-w-6xl">
        <TyendinagaHistory />
      </ChapterSection>
      <HeritageDivider />
      <ChapterSection label="IV — The Timeline">
        <HeritageTimeline />
      </ChapterSection>
    </div>
  );
}