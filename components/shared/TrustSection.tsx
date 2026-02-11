export function TrustSection() {
    return (
        <section className="border-y border-zinc-800 bg-zinc-900/30 py-16">
            <div className="container mx-auto px-6">
                <div className="grid gap-12 md:grid-cols-3">
                    {/* Client Logos */}
                    <div>
                        <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                            Trusted By
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-3 text-sm text-zinc-400">
                                100+ Clients
                            </div>
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-3 text-sm text-zinc-400">
                                500+ Projects
                            </div>
                        </div>
                    </div>

                    {/* Google Reviews */}
                    <div>
                        <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                            Client Reviews
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-bold text-white">4.9</span>
                            <div>
                                <div className="flex text-amber-500 text-lg">★★★★★</div>
                                <p className="text-sm text-zinc-400">Google Reviews</p>
                            </div>
                        </div>
                    </div>

                    {/* Equipment Badges */}
                    <div>
                        <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                            Premium Gear
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">Sony</span>
                            <span className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">Canon</span>
                            <span className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">Nikon</span>
                            <span className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">Rode</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
