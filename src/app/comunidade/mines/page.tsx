import type { Metadata } from "next";
import MinesGame from "@/components/MinesGame";

export const metadata: Metadata = {
  title: "Mines | Arena",
  description: "Joga Mines e multiplica os teus pontos. Evita as minas e faz cashout a tempo!",
};

export default function MinesPage() {
  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <MinesGame />
      </div>
    </main>
  );
}
