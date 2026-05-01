"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ModeradorBonusHuntPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/outros/bonus-hunt");
  }, [router]);
  return null;
}
