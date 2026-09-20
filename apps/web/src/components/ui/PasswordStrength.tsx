import { cn } from "../../lib/utils.ts";

const COMMON = [
  "password",
  "senha",
  "123456",
  "qwerty",
  "admin",
  "phc",
  "treino",
  "abc",
  "111111",
  "iloveyou",
];
/** força 0-4 (heurística leve, sem dependências) */
export function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  const low = pw.toLowerCase();
  if (COMMON.some((c) => low.includes(c))) return { score: 0, label: "muito fraca (comum)" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;
  score = Math.min(4, score);
  const labels = ["muito fraca", "fraca", "razoável", "boa", "forte"];
  return { score, label: labels[score] };
}

export function StrengthMeter({ pw }: { pw: string }) {
  const { score, label } = passwordStrength(pw);
  if (!pw) return null;
  const colors = ["bg-destructive", "bg-destructive", "bg-warning", "bg-success", "bg-success"];
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn("h-1.5 flex-1 rounded-full", i < score ? colors[score] : "bg-secondary")}
          />
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
