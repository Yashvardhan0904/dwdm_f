"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { SYMPTOMS } from "@/app/data/symptoms";

import { SelectedTags } from "./SelectedTags";
import { SymptomAutocomplete } from "./SymptomAutocomplete";

const GENDERS = ["Male", "Female", "Other"];

export function FormCard() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [availableSymptoms, setAvailableSymptoms] = useState<string[]>([...SYMPTOMS]);
  const [diseaseCount, setDiseaseCount] = useState<number | null>(null);

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://dwdm-b.onrender.com",
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadSymptoms = async () => {
      try {
        const [symptomsResponse, diseasesResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/symptoms`, {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch(`${apiBaseUrl}/diseases`, {
            signal: controller.signal,
            cache: "no-store",
          }),
        ]);

        if (symptomsResponse.ok) {
          const symptomData = (await symptomsResponse.json()) as { symptoms?: string[] };

          if (Array.isArray(symptomData.symptoms) && symptomData.symptoms.length > 0) {
            setAvailableSymptoms(symptomData.symptoms);
          }
        }

        if (diseasesResponse.ok) {
          const diseaseData = (await diseasesResponse.json()) as { count?: number };

          if (typeof diseaseData.count === "number") {
            setDiseaseCount(diseaseData.count);
          }
        }
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }
      }
    };

    void loadSymptoms();

    return () => {
      controller.abort();
    };
  }, [apiBaseUrl]);

  const canSubmit = useMemo(
    () => name.trim() && age.trim() && gender && selectedSymptoms.length > 0,
    [name, age, gender, selectedSymptoms],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAge = Number(age);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!Number.isFinite(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      setError("Please enter a valid age between 1 and 120.");
      return;
    }

    if (!gender) {
      setError("Please select your gender.");
      return;
    }

    if (selectedSymptoms.length === 0) {
      setError("Please select at least one symptom.");
      return;
    }

    setError("");

    const params = new URLSearchParams({
      name: name.trim(),
      age: String(parsedAge),
      gender,
      symptoms: JSON.stringify(selectedSymptoms),
    });

    router.push(`/result?${params.toString()}`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-2xl rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-[0_20px_50px_-30px_rgba(2,132,199,0.45)] backdrop-blur md:p-8"
    >
      <header className="mb-6 text-center md:mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          AI Disease Predictor
        </h1>
        <p className="mt-2 text-slate-600">
          Enter your symptoms to get instant insights
        </p>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Age</span>
            <input
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(event) => setAge(event.target.value)}
              placeholder="e.g. 28"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Gender</span>
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Select gender</option>
            {GENDERS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Symptoms</span>
          <SymptomAutocomplete
            symptoms={availableSymptoms}
            selectedSymptoms={selectedSymptoms}
            onSelectSymptom={(symptom) => {
              setSelectedSymptoms((current) => {
                if (current.includes(symptom)) {
                  return current;
                }
                return [...current, symptom];
              });
            }}
          />
          <p className="text-xs text-slate-500">
            {diseaseCount
              ? `Model can predict ${diseaseCount} diseases. You can select multiple symptoms.`
              : "You can select multiple symptoms."}
          </p>
        </div>

        <SelectedTags
          tags={selectedSymptoms}
          onRemove={(tag) => {
            setSelectedSymptoms((current) =>
              current.filter((symptom) => symptom !== tag),
            );
          }}
        />

        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition disabled:cursor-not-allowed disabled:opacity-55"
        >
          Predict Disease
        </motion.button>
      </form>
    </motion.section>
  );
}