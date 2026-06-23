"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { quizQuestions, quizResults, type QuizResultKey } from "@/lib/data/quiz";
import { mockDestinations } from "@/lib/data/destinations-mock";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const emptyScores: Record<QuizResultKey, number> = { vis: 0, rovinj: 0, mostar: 0, korcula: 0 };

export function QuizFlow() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<QuizResultKey, number>>(emptyScores);

  const isComplete = step >= quizQuestions.length;
  const question = quizQuestions[step];
  const progress = (Math.min(step, quizQuestions.length) / quizQuestions.length) * 100;

  const winner = useMemo<QuizResultKey>(() => {
    return (Object.keys(scores) as QuizResultKey[]).reduce((best, key) =>
      scores[key] > scores[best] ? key : best
    );
  }, [scores]);

  function answer(result: QuizResultKey) {
    setScores((prev) => ({ ...prev, [result]: prev[result] + 1 }));
    setStep((prev) => prev + 1);
  }

  function retake() {
    setStep(0);
    setScores(emptyScores);
  }

  if (isComplete) {
    const profile = quizResults[winner];
    const destination = mockDestinations.find((d) => d.slug === profile.destinationSlug);

    return (
      <div className="grid gap-8 lg:grid-cols-2">
        {destination && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-md">
            <Image src={destination.hero_image_url} alt={destination.name} fill className="object-cover" />
          </div>
        )}
        <div>
          <p className="font-sans text-xs uppercase tracking-widest text-accent">{profile.personalityTitle}</p>
          <h2 className="mt-2 font-display text-4xl text-sage-dark">{profile.resultTitle}</h2>
          <p className="mt-4 font-serif text-foreground/85">{profile.description}</p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {profile.traits.map((trait) => (
              <li
                key={trait}
                className="rounded-full border border-border px-3 py-1 font-sans text-xs uppercase tracking-widest text-muted-foreground"
              >
                {trait}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            {destination && (
              <Button asChild>
                <Link href={`/hidden-gems/${destination.slug}`}>Explore {destination.name} →</Link>
              </Button>
            )}
            <Button variant="outline" onClick={retake}>
              Retake the quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Progress value={progress} />
      <p className="mt-3 font-sans text-xs uppercase tracking-widest text-muted-foreground">
        Question {step + 1} of {quizQuestions.length}
      </p>

      <h2 className="mt-4 font-display text-3xl text-sage-dark">{question.prompt}</h2>

      <div className="mt-6 flex flex-col gap-3">
        {question.options.map((option) => (
          <button
            key={option.text}
            onClick={() => answer(option.result)}
            className="rounded-md border border-border px-5 py-4 text-left font-serif text-foreground/90 transition-colors hover:border-primary hover:bg-muted/40"
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
}
