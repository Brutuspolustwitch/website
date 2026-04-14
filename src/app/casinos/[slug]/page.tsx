import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArenaCard } from "@/components/ui/ArenaCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { generateCasinoReviewSchema } from "@/lib/schema";

/**
 * Dynamic casino review page — SEO-optimized with schema markup.
 * Each casino gets a full landing page with structured data for
 * Review, FAQ, and Product schemas.
 */

// Casino data — in production, fetched from Supabase
const CASINO_DATA: Record<
  string,
  {
    name: string;
    rating: number;
    bonus: string;
    bonusDetails: string;
    pros: string[];
    cons: string[];
    countries: string[];
    reviewBody: string;
    faq: { question: string; answer: string }[];
  }
> = {
  "stake-casino": {
    name: "Stake Casino",
    rating: 4.8,
    bonus: "200% up to $2,000",
    bonusDetails:
      "New players receive a 200% match bonus on their first deposit, up to $2,000. The wagering requirement is 40x the bonus amount. Minimum deposit is $20.",
    pros: ["Crypto-friendly payments", "Fast withdrawal processing", "Huge game library with 3000+ games", "Provably fair originals"],
    cons: ["No UKGC license", "Limited fiat options"],
    countries: ["Worldwide (except US, UK, AU)"],
    reviewBody:
      "Stake Casino stands as one of the premier crypto-friendly online casinos. With over 3,000 games from top providers, provably fair originals, and lightning-fast payouts, it's a gladiator's choice for serious play. The VIP program rewards loyal players with personalized bonuses, higher withdrawal limits, and dedicated support. The sportsbook section adds extra variety for those who enjoy betting on traditional sports and esports.",
    faq: [
      { question: "Is Stake Casino safe?", answer: "Yes, Stake operates under a Curacao gaming license and uses provably fair algorithms for its original games." },
      { question: "What cryptocurrencies does Stake accept?", answer: "Stake accepts Bitcoin, Ethereum, Litecoin, Dogecoin, Ripple, Tron, EOS, and Bitcoin Cash." },
      { question: "How fast are withdrawals?", answer: "Crypto withdrawals are typically processed within minutes. Fiat withdrawals may take 1-3 business days." },
      { question: "Does Stake have a VIP program?", answer: "Yes, Stake has a multi-tier VIP program with benefits including rakeback, bonuses, and dedicated account managers." },
    ],
  },
  roobet: {
    name: "Roobet",
    rating: 4.5,
    bonus: "Instant Rakeback",
    bonusDetails:
      "Roobet offers instant rakeback on all bets placed. The rakeback percentage increases with your VIP level. No minimum deposit required for crypto.",
    pros: ["Clean, intuitive interface", "Original provably fair games", "Instant rakeback system", "Regular promotions"],
    cons: ["Limited to cryptocurrency", "Some country restrictions"],
    countries: ["Most countries (except US, UK, AU, NL)"],
    reviewBody:
      "Roobet has carved out a unique position in the crypto casino space with its clean design and innovative original games. The instant rakeback system means players earn back a percentage of every bet, regardless of outcome. Roobet Crash and Towers are community favorites, while the extensive slot collection covers all major providers.",
    faq: [
      { question: "What is Roobet Rakeback?", answer: "Rakeback is a percentage of your wagered amount returned to you automatically, regardless of whether you win or lose." },
      { question: "Can I play Roobet in the US?", answer: "No, Roobet is not available to players in the United States due to regulatory restrictions." },
      { question: "Is Roobet provably fair?", answer: "Yes, Roobet's original games use provably fair technology that allows players to verify the fairness of each bet." },
    ],
  },
  duelbits: {
    name: "DuelBits",
    rating: 4.3,
    bonus: "Up to $500 bonus",
    bonusDetails:
      "New players can claim up to $500 in bonus funds. The bonus is released in stages as you wager on games and sports.",
    pros: ["Esports betting integration", "Low minimum deposits", "Growing VIP program", "Modern interface"],
    cons: ["Newer platform", "Smaller game library"],
    countries: ["Worldwide (except US, UK)"],
    reviewBody:
      "DuelBits combines casino gaming with esports betting in a sleek, modern package. While newer to the scene, it has quickly built a loyal following thanks to competitive odds, an expanding game library, and a responsive VIP program. The integration of esports betting alongside traditional casino games makes it a versatile choice.",
    faq: [
      { question: "Does DuelBits offer esports betting?", answer: "Yes, DuelBits features a comprehensive esports betting section covering CS2, Dota 2, League of Legends, and more." },
      { question: "What is the minimum deposit?", answer: "The minimum deposit varies by cryptocurrency but is generally very low, starting from a few dollars equivalent." },
    ],
  },
  rollbit: {
    name: "Rollbit",
    rating: 4.6,
    bonus: "NFT Rewards + Bonus",
    bonusDetails:
      "Rollbit combines traditional casino bonuses with NFT-based rewards. Holders of Rollbit NFTs receive enhanced benefits, including higher rakeback and exclusive promotions.",
    pros: ["Unique NFT reward system", "Integrated sportsbook", "High RTP slot selection", "Innovative features"],
    cons: ["Complex interface for beginners", "NFT features can be confusing"],
    countries: ["Most countries (except US, UK)"],
    reviewBody:
      "Rollbit is pushing the boundaries of what a crypto casino can be. Their NFT integration creates a unique rewards ecosystem where players can earn, trade, and benefit from digital collectibles. Combined with a solid sportsbook, high-RTP slots, and innovative features like leveraged trading, Rollbit offers an experience unlike any other platform.",
    faq: [
      { question: "What are Rollbit NFTs?", answer: "Rollbit NFTs are digital collectibles that provide holders with enhanced casino benefits, including increased rakeback and exclusive promotions." },
      { question: "Does Rollbit have sports betting?", answer: "Yes, Rollbit features a comprehensive sportsbook covering traditional sports and esports." },
      { question: "Is Rollbit regulated?", answer: "Rollbit operates under a Curacao gaming license." },
    ],
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(CASINO_DATA).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const casino = CASINO_DATA[slug];
  if (!casino) return {};

  return {
    title: `${casino.name} Review — Bonus, Rating & Guide`,
    description: `${casino.name} review: ${casino.bonus}. Rating: ${casino.rating}/5. Honest analysis from the Arena.`,
    openGraph: {
      title: `${casino.name} Review | Arena Gladiator`,
      description: `${casino.bonus} — ${casino.rating}/5 rating`,
    },
  };
}

export default async function CasinoReviewPage({ params }: PageProps) {
  const { slug } = await params;
  const casino = CASINO_DATA[slug];
  if (!casino) notFound();

  const schemas = generateCasinoReviewSchema({
    name: casino.name,
    slug,
    rating: casino.rating,
    bonus: casino.bonus,
    reviewBody: casino.reviewBody,
    faq: casino.faq,
  });

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Schema markup for SEO */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title={casino.name}
            subtitle={`Rating: ${casino.rating}/5 — ${casino.bonus}`}
          />
        </ScrollReveal>

        {/* Bonus highlight */}
        <ScrollReveal delay={0.1}>
          <ArenaCard variant="crimson" className="p-8 text-center mb-10">
            <p className="gladiator-subtitle text-xs mb-2">
              Exclusive Bonus
            </p>
            <p className="text-3xl font-bold text-arena-gold arena-glow mb-3">
              {casino.bonus}
            </p>
            <p className="text-sm text-arena-smoke max-w-xl mx-auto mb-6">
              {casino.bonusDetails}
            </p>
            <ArenaButton size="lg" variant="primary">
              Claim Bonus Now
            </ArenaButton>
          </ArenaCard>
        </ScrollReveal>

        {/* Review body */}
        <ScrollReveal delay={0.2}>
          <ArenaCard className="p-8 mb-8">
            <h2 className="gladiator-title text-xl mb-4">
              Full Review
            </h2>
            <p className="text-arena-smoke leading-relaxed">{casino.reviewBody}</p>
          </ArenaCard>
        </ScrollReveal>

        {/* Pros & Cons */}
        <ScrollReveal delay={0.3}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ArenaCard className="p-6">
              <h3 className="gladiator-label text-sm font-bold text-green-400 mb-4">
                Strengths
              </h3>
              <ul className="space-y-3">
                {casino.pros.map((pro) => (
                  <li key={pro} className="flex items-start gap-2 text-sm text-arena-smoke">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </ArenaCard>
            <ArenaCard className="p-6">
              <h3 className="gladiator-label text-sm font-bold text-arena-red mb-4">
                Weaknesses
              </h3>
              <ul className="space-y-3">
                {casino.cons.map((con) => (
                  <li key={con} className="flex items-start gap-2 text-sm text-arena-smoke">
                    <span className="text-arena-red mt-0.5 shrink-0">✗</span>
                    {con}
                  </li>
                ))}
              </ul>
            </ArenaCard>
          </div>
        </ScrollReveal>

        {/* Supported countries */}
        <ScrollReveal delay={0.4}>
          <ArenaCard className="p-6 mb-8">
            <h3 className="gladiator-label text-sm font-bold text-arena-gold mb-3">
              Availability
            </h3>
            <p className="text-sm text-arena-smoke">{casino.countries.join(", ")}</p>
          </ArenaCard>
        </ScrollReveal>

        {/* FAQ Section (SEO) */}
        <ScrollReveal delay={0.5}>
          <ArenaCard className="p-8">
            <h2 className="gladiator-title text-xl mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {casino.faq.map((item, i) => (
                <div key={i} className="border-b border-arena-steel/15 pb-4 last:border-0">
                  <h3 className="font-bold text-arena-white mb-2">{item.question}</h3>
                  <p className="text-sm text-arena-smoke leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </ArenaCard>
        </ScrollReveal>
      </div>
    </div>
  );
}
