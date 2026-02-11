'use client';

import { FadeIn } from "@/components/animations/FadeIn";
import { Check } from "lucide-react";

const steps = [
    {
        number: "01",
        title: "Browse & Select",
        description: "Explore our equipment catalog or studio spaces. Check specs, pricing, and availability.",
    },
    {
        number: "02",
        title: "Check Availability",
        description: "View real-time availability for your preferred dates. No hidden surprises.",
    },
    {
        number: "03",
        title: "Book via WhatsApp",
        description: "Tap 'Book Now' to open WhatsApp with pre-filled details. Confirm and you're set!",
    },
];

export function HowItWorks() {
    return (
        <section className="border-t border-zinc-800 bg-zinc-900/30 py-24">
            <div className="container mx-auto px-6">
                <FadeIn>
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold md:text-5xl">How It Works</h2>
                        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
                            From browsing to booking in under 3 clicks. No forms, no hassle.
                        </p>
                    </div>
                </FadeIn>

                <div className="grid gap-8 md:grid-cols-3">
                    {steps.map((step, index) => (
                        <FadeIn key={step.number} delay={index * 0.2}>
                            <div className="relative">
                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div className="absolute left-1/2 top-16 hidden h-0.5 w-full bg-gradient-to-r from-zinc-700 to-transparent md:block" />
                                )}

                                <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
                                    {/* Step Number */}
                                    <div className="mb-6 flex justify-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-900 text-2xl font-bold text-white">
                                            {step.number}
                                        </div>
                                    </div>

                                    <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
                                    <p className="text-zinc-400">{step.description}</p>

                                    {/* Check Icon for completion */}
                                    {index === steps.length - 1 && (
                                        <div className="mt-6 flex justify-center">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                                                <Check className="h-5 w-5 text-green-500" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                <FadeIn delay={0.6}>
                    <div className="mt-12 text-center">
                        <p className="text-sm text-zinc-500">
                            Average booking time: <span className="font-semibold text-white">5 minutes</span>
                        </p>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}
