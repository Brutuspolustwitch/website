import type { Metadata } from "next";
import AdminBrutaDoMesConfig from "@/components/AdminBrutaDoMesConfig";

export const metadata: Metadata = {
  title: "Bruta do Mês — Admin",
};

export default function AdminBrutaDoMesPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-4">
          <AdminBrutaDoMesConfig />
        </div>
      </div>
    </div>
  );
}
