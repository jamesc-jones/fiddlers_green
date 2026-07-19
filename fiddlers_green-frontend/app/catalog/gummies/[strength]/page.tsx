export default async function GummiesStrengthPage({
  params,
}: {
  params: Promise<{ strength: string }>;
}) {
  const { strength } = await params;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="font-body text-xs tracking-[0.3em] text-brand-gold uppercase">
        {strength}
      </p>
      <p className="mt-4 font-body text-white/60 text-sm tracking-[0.2em] uppercase">
        Wholesale pricing &amp; product details — coming soon
      </p>
    </main>
  );
}
