import { useState } from "react";

export default function Hero() {
  const [count, setCount] = useState(0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-6 py-20">
        <p className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-widest text-cyan-300">
          Astro + React + Tailwind
        </p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          React-driven Astro site
        </h1>
        <p className="max-w-xl text-slate-300">
          This page is rendered by Astro and hydrated with a React component for
          client-side interactivity.
        </p>
        <button
          className="rounded-lg bg-cyan-400 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-300"
          onClick={() => setCount((value) => value + 1)}
          type="button"
        >
          Clicked {count} times
        </button>
      </div>
    </main>
  );
}
