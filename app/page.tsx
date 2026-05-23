import Link from "next/link";
import { SFI26_ACTIONS } from "./data/sfi26-actions";

export default function Home() {
  const actionCount = SFI26_ACTIONS.length;

  return (
    <div className="flex flex-1 flex-col bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold tracking-tight text-emerald-800">
            SFI26 Calculator
          </span>
          <Link
            href="/calculator"
            className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Start calculating →
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-stone-200 bg-gradient-to-b from-emerald-50 to-stone-50">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Sustainable Farming Incentive 2026
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 sm:text-6xl">
              How much could you earn from SFI26?
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-stone-700">
              Free calculator. Enter your land, pick the actions, see your
              estimated annual payment. About two minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/calculator"
                className="rounded-lg bg-emerald-700 px-7 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Calculate my payment →
              </Link>
              <span className="text-sm text-stone-600">
                Free · No sign-up · Mobile-friendly
              </span>
            </div>
            <p className="mt-6 text-xs text-stone-500">
              Based on official DEFRA / RPA SFI26 data published May 2026.
            </p>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-semibold text-stone-900 sm:text-3xl">
              All {actionCount} SFI26 actions. One calculator.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-stone-600">
              We&rsquo;ve modelled every action in the Sustainable Farming
              Incentive 2026 scheme — payment rates, eligibility, stacking
              rules, the 25% area cap, the £100,000 annual cap.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <Feature
                title="Tailored to your farm"
                body="Only shows actions your land is actually eligible for. Arable, grassland, moorland, organic — it filters automatically."
              />
              <Feature
                title="Maxes out your payment"
                body="Spots actions you&rsquo;re missing and shows you how much more you could earn. Add them with one click."
              />
              <Feature
                title="Honest about the caps"
                body="Warns you when the 25% area cap kicks in or when you hit the £100,000 annual ceiling. No surprises later."
              />
            </div>
          </div>
        </section>

        <section className="bg-stone-50 py-16">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
              When does SFI26 open?
            </h2>
            <dl className="mt-6 space-y-4">
              <div className="rounded-lg border border-stone-200 bg-white p-5">
                <dt className="font-semibold text-emerald-800">
                  Window 1 — June 2026
                </dt>
                <dd className="mt-1 text-stone-700">
                  Open to small farms (50 ha or less) and farms without an
                  existing ELM agreement.
                </dd>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white p-5">
                <dt className="font-semibold text-emerald-800">
                  Window 2 — September 2026
                </dt>
                <dd className="mt-1 text-stone-700">
                  Open to all eligible farmers — including those with existing
                  SFI23/24, CS Mid Tier, CS Higher Tier or HLS agreements.
                </dd>
              </div>
            </dl>
            <div className="mt-8 text-center">
              <Link
                href="/calculator"
                className="rounded-lg bg-emerald-700 px-7 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Start calculating →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-stone-500">
          <p>
            This calculator provides estimates only based on published SFI26
            payment rates. It is not financial advice. Always verify
            eligibility and payment amounts with the Rural Payments Agency
            before submitting your application. JR Data Solutions is not
            affiliated with DEFRA, the RPA, or the UK Government.
          </p>
          <p className="mt-3 text-stone-400">Built by JR Data Solutions.</p>
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-6">
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm text-stone-700">{body}</p>
    </div>
  );
}
