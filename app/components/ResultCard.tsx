"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SelectedTags } from "./SelectedTags";

type ResultCardProps = {
  name: string;
  age: number;
  gender: string;
  symptoms: string[];
};

export function ResultCard({ name, age, gender, symptoms }: ResultCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disease, setDisease] = useState("-");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://dwdm-b.onrender.com",
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    const runPrediction = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${apiBaseUrl}/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(symptoms),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Prediction request failed.");
        }

        const data = (await response.json()) as {
          predicted_disease?: string;
          confidence?: number | null;
        };

        setDisease(data.predicted_disease ?? "Unknown");
        setConfidence(
          typeof data.confidence === "number"
            ? Math.max(0, Math.min(100, Math.round(data.confidence)))
            : null,
        );
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }
        setError("Could not connect to backend. Please try again in a few seconds.");
      } finally {
        setLoading(false);
      }
    };

    void runPrediction();

    return () => {
      controller.abort();
    };
  }, [apiBaseUrl, symptoms, retryKey]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-2xl rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-[0_20px_50px_-30px_rgba(2,132,199,0.45)] backdrop-blur md:p-8"
    >
      <h1 className="text-center text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
        Prediction Result
      </h1>

      <div className="mt-6 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Name:</span> {name}
        </p>
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Age:</span> {age}
        </p>
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Gender:</span> {gender}
        </p>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-slate-900">Selected Symptoms</p>
        <SelectedTags tags={symptoms} />
      </div>

      <div className="mt-8 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50 p-5">
        <p className="text-sm font-medium uppercase tracking-wide text-sky-700">
          Predicted Disease
        </p>
        <p className="mt-1 text-3xl font-bold text-slate-900">
          {loading ? "Predicting..." : disease}
        </p>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-600">Confidence Score</span>
            <span className="text-sm font-semibold text-slate-900">
              {loading ? "--" : confidence !== null ? `${confidence}%` : "N/A"}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-sky-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width:
                  !loading && confidence !== null
                    ? `${confidence}%`
                    : !loading
                      ? "18%"
                      : "0%",
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
            />
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          {error || "This prediction is based on the symptoms provided by you."}
        </p>

        {error ? (
          <button
            type="button"
            onClick={() => setRetryKey((current) => current + 1)}
            className="mt-3 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
          >
            Retry Backend Connection
          </button>
        ) : null}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Link
            href="/"
            className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 transition hover:border-slate-300"
          >
            Check Again
          </Link>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200"
        >
          View Precautions
        </motion.button>
      </div>
    </motion.section>
  );
}