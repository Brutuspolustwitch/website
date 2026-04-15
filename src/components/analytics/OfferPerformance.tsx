"use client";

import { useEffect, useState, useCallback } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OfferStat {
  offer_id: string;
  offer_name: string;
  casino_name: string;
  total_clicks: number;
  unique_sessions: number;
  suspicious_clicks: number;
  legitimate_clicks: number;
}

export default function OfferPerformance() {
  const [offers, setOffers] = useState<OfferStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const loadData = useCallback(async () => {
    setLoading(true);
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    // Get all offer clicks
    const { data: events } = await supabase
      .from("analytics_events")
      .select("offer_id, session_id, is_suspicious")
      .eq("event_type", "offer_click")
      .not("offer_id", "is", null)
      .gte("created_at", since);

    if (!events || events.length === 0) {
      setOffers([]);
      setLoading(false);
      return;
    }

    // Get offer details
    const offerIds = [...new Set(events.map((e) => e.offer_id))];
    const { data: offerData } = await supabase
      .from("casino_offers")
      .select("id, title, casino_name")
      .in("id", offerIds);

    const offerMap: Record<string, { title: string; casino_name: string }> = {};
    for (const o of offerData ?? []) {
      offerMap[o.id] = { title: o.title, casino_name: o.casino_name };
    }

    // Aggregate stats
    const statsMap: Record<string, OfferStat> = {};
    for (const e of events) {
      const oid = e.offer_id!;
      if (!statsMap[oid]) {
        const info = offerMap[oid];
        statsMap[oid] = {
          offer_id: oid,
          offer_name: info?.title ?? "Desconhecida",
          casino_name: info?.casino_name ?? "—",
          total_clicks: 0,
          unique_sessions: 0,
          suspicious_clicks: 0,
          legitimate_clicks: 0,
        };
      }
      statsMap[oid].total_clicks++;
      if (e.is_suspicious) statsMap[oid].suspicious_clicks++;
      else statsMap[oid].legitimate_clicks++;
    }

    // Count unique sessions per offer
    for (const oid of Object.keys(statsMap)) {
      const uniqueSessions = new Set(
        events.filter((e) => e.offer_id === oid).map((e) => e.session_id)
      );
      statsMap[oid].unique_sessions = uniqueSessions.size;
    }

    const sorted = Object.values(statsMap).sort((a, b) => b.total_clicks - a.total_clicks);
    setOffers(sorted);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const chartData = offers.slice(0, 10).map((o) => ({
    name: o.offer_name.length > 20 ? o.offer_name.slice(0, 20) + "…" : o.offer_name,
    cliques: o.legitimate_clicks,
    suspeitos: o.suspicious_clicks,
  }));

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Performance de Ofertas" subtitle="Cliques e interações por oferta" />

        {/* Period selector */}
        <div className="flex justify-center gap-2 mb-8">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-arena-gold text-arena-black"
                  : "bg-arena-dark/60 text-arena-smoke hover:bg-arena-dark"
              }`}
            >
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center mt-16">
            <div className="animate-spin w-10 h-10 border-2 border-arena-gold border-t-transparent rounded-full" />
          </div>
        ) : offers.length === 0 ? (
          <p className="text-center text-arena-ash mt-12">Nenhum dado de oferta neste período.</p>
        ) : (
          <>
            {/* Bar chart of top 10 */}
            <div className="arena-card p-6 rounded-xl border border-arena-gold/10 mb-8">
              <h3 className="text-arena-gold font-[family-name:var(--font-ui)] text-lg mb-4">
                Top 10 Ofertas por Cliques
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" tick={{ fill: "#999", fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#999", fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #d4a853", borderRadius: 8 }}
                    labelStyle={{ color: "#d4a853" }}
                  />
                  <Bar dataKey="cliques" fill="#d4a853" name="Cliques legítimos" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="suspeitos" fill="#c0392b" name="Suspeitos" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Offer table */}
            <div className="arena-card rounded-xl border border-arena-gold/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-arena-dark/60 text-arena-gold/80 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Oferta</th>
                      <th className="px-4 py-3">Casino</th>
                      <th className="px-4 py-3">Cliques Totais</th>
                      <th className="px-4 py-3">Sessões Únicas</th>
                      <th className="px-4 py-3">Legítimos</th>
                      <th className="px-4 py-3">Suspeitos</th>
                      <th className="px-4 py-3">% Suspeitos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arena-gold/5">
                    {offers.map((o) => {
                      const suspectPct =
                        o.total_clicks > 0
                          ? ((o.suspicious_clicks / o.total_clicks) * 100).toFixed(1)
                          : "0";
                      return (
                        <tr key={o.offer_id} className="hover:bg-arena-dark/40 transition-colors">
                          <td className="px-4 py-3 text-arena-smoke">{o.offer_name}</td>
                          <td className="px-4 py-3 text-arena-ash">{o.casino_name}</td>
                          <td className="px-4 py-3 text-arena-gold font-medium">{o.total_clicks}</td>
                          <td className="px-4 py-3 text-arena-smoke">{o.unique_sessions}</td>
                          <td className="px-4 py-3 text-green-400">{o.legitimate_clicks}</td>
                          <td className="px-4 py-3 text-red-400">{o.suspicious_clicks}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-medium ${
                                Number(suspectPct) > 20 ? "text-red-400" : "text-arena-ash"
                              }`}
                            >
                              {suspectPct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CSV Export */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  const header = "Oferta,Casino,Cliques,Sessões Únicas,Legítimos,Suspeitos,% Suspeitos\n";
                  const rows = offers.map((o) => {
                    const pct = o.total_clicks > 0 ? ((o.suspicious_clicks / o.total_clicks) * 100).toFixed(1) : "0";
                    return `"${o.offer_name}","${o.casino_name}",${o.total_clicks},${o.unique_sessions},${o.legitimate_clicks},${o.suspicious_clicks},${pct}%`;
                  });
                  const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `ofertas-performance-${period}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-arena-gold/10 text-arena-gold text-sm rounded-lg hover:bg-arena-gold/20 transition-colors"
              >
                📥 Exportar CSV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
