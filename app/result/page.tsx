import { ResultCard } from "@/app/components/ResultCard";

export const dynamic = "force-dynamic";

type RawSearchParams = Record<string, string | string[] | undefined>;

type ResultPageProps = {
  searchParams: Promise<RawSearchParams>;
};

function pickString(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return "";
}

function parseSymptoms(value: string): string[] {
  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return [];
  }

  return [];
}

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const params = await searchParams;

  const name = pickString(params.name) || "Guest User";
  const ageParam = pickString(params.age);
  const age = Number.isFinite(Number(ageParam)) ? Number(ageParam) : 0;
  const gender = pickString(params.gender) || "Not specified";
  const symptoms = parseSymptoms(pickString(params.symptoms));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 md:px-8">
      <ResultCard name={name} age={age} gender={gender} symptoms={symptoms} />
    </main>
  );
}