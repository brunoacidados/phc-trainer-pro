import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LABS } from "@/content";
import { getProfile } from "@/server/session";
import { StartForms } from "./StartForms";

export const metadata: Metadata = { title: "Começar" };

export default async function StartPage() {
  if (await getProfile()) redirect("/");
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold sm:text-4xl">Aprenda PHC um passo de cada vez.</h1>
      <ul className="my-6 space-y-2 text-lg">
        <li>✓ {LABS.length} missões práticas, divididas em passos pequenos</li>
        <li>✓ O app diz-lhe sempre <b>qual é o próximo passo</b></li>
        <li>✓ Revisões automáticas para não esquecer</li>
      </ul>
      <StartForms />
    </div>
  );
}
