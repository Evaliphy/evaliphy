import Image from "next/image";
import Link from "next/link";
import { CodeBlock } from "./components/CodeBlock";

const exampleCode = `import { evaluate, expect } from 'evaliphy';

const sample = {
  query: "What is the return policy?",
  expectedContext: "Items can be returned within 30 days."
};

evaluate("Return Policy Chat", async ({ httpClient }) => {
  // 1. Hit your RAG endpoint
  const res = await httpClient.post('/api/chat', { message: sample.query });
  const data = await res.json();

  // 2. Assert in plain English
  await expect({
    query: sample.query,
    response: data.answer,
    context: sample.expectedContext
  }).toBeFaithful();

  await expect({
    query: sample.query,
    response: data.answer,
    context: sample.expectedContext
  }).toBeRelevant({threshold:0.7});
});`;

export default async function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 md:px-12 lg:px-24 max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2 flex flex-col items-start space-y-8">
            <div className="inline-flex items-center rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-600">
              <span className="mr-2">✨</span> Now in beta
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.1]">
                RAG testing for <br />
                QA engineers.
              </h1>
              <p className="text-xl text-zinc-600 leading-relaxed max-w-xl">
                Evaliphy fits inside your existing test workflow. Assertions,
                real API calls, CI reports. No ML required.
              </p>
            </div>

            <div className="flex flex-col space-y-8">
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/docs/quick-start"
                  className="px-8 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  href="https://github.com/priyanshus/evaliphy"
                  className="px-8 py-3 border border-zinc-200 text-zinc-900 rounded-lg font-medium hover:bg-zinc-50 transition-colors"
                >
                  View on GitHub
                </Link>
              </div>

              <a
                href="https://www.producthunt.com/products/evaliphy?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-evaliphy"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1116079&theme=dark&t=1775371542211"
                  alt="Evaliphy - E2E RAG testing for QA engineers | No ML overhead | Product Hunt"
                  width="250"
                  height="54"
                  className="w-[250px] h-[54px]"
                />
              </a>
            </div>
          </div>

          <div className="lg:col-span-3 w-full">
            <CodeBlock code={exampleCode} filename="return-policy.eval.ts" />
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-12 border-y border-zinc-100 bg-zinc-50/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Works with
            </span>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-50 grayscale">
              <span className="text-xl font-bold text-zinc-900">OpenAI</span>
              <span className="text-xl font-bold text-zinc-900">Anthropic</span>
              <span className="text-xl font-bold text-zinc-900">OpenRouter</span>
              <span className="text-xl font-bold text-zinc-900">Mistral</span>
            </div>
          </div>
        </div>
      </section>

      {/* Evaliphy Report Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900">
            Human-readable evaluation reports
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Get detailed, human-readable reports with LLM-judge reasoning.
          </p>
        </div>

        <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50 p-2 overflow-hidden shadow-2xl">
          <Image
            src="/images/report.png"
            alt="Evaliphy Evaluation Report"
            width={1200}
            height={800}
            className="rounded-xl object-cover w-full h-auto"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-zinc-50/50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900">
              Built for Quality Engineers, not Data Scientists.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="w-10 h-10 bg-white rounded-lg border border-zinc-100 flex items-center justify-center shadow-sm">
                <svg
                  className="w-5 h-5 text-zinc-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">
                Understandable Metrics
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                Forget "Contextual Precision" and "Cosine Similarity." Assert
                against what actually matters:
                <code className="mx-1 text-zinc-900 font-mono text-sm">
                  toBeFaithful()
                </code>
                ,
                <code className="mx-1 text-zinc-900 font-mono text-sm">
                  toBeRelevant()
                </code>
                , and
                <code className="mx-1 text-zinc-900 font-mono text-sm">
                  toBeGrounded()
                </code>
                .
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-10 h-10 bg-white rounded-lg border border-zinc-100 flex items-center justify-center shadow-sm">
                <svg
                  className="w-5 h-5 text-zinc-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">
                Explicit, Traceable Data Flow
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                No magic background context. Pass your golden data, CSV rows, or
                database records directly into the assertions so you always know
                exactly what is being tested.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-10 h-10 bg-white rounded-lg border border-zinc-100 flex items-center justify-center shadow-sm">
                <svg
                  className="w-5 h-5 text-zinc-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">
                Battle-Tested Prompts
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                We spent hundreds of hours benchmarking LLM-as-a-judge prompts
                so you don't have to. Just provide your API key, and Evaliphy
                handles the prompting, parsing, and retry logic.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-10 h-10 bg-white rounded-lg border border-zinc-100 flex items-center justify-center shadow-sm">
                <svg
                  className="w-5 h-5 text-zinc-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">
                Runs Where You Run
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                It’s just Node.js. Run your RAG evaluations in GitHub Actions,
                GitLab CI, or Jenkins using the standard
                <code className="mx-1 text-zinc-900 font-mono text-sm">
                  npx evaliphy run
                </code>{" "}
                command.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900">
            Built for QA, not Research
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Evaliphy is the only evaluation framework that treats RAG as a black box.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="py-4 px-6 text-left text-sm font-semibold text-zinc-900">Feature</th>
                <th className="py-4 px-6 text-center text-sm font-semibold text-zinc-900 bg-zinc-50/50">Evaliphy</th>
                <th className="py-4 px-6 text-center text-sm font-semibold text-zinc-500">DeepEval / Ragas</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-100">
                <td className="py-4 px-6 text-sm text-zinc-600">Primary Audience</td>
                <td className="py-4 px-6 text-center text-sm font-medium text-zinc-900 bg-zinc-50/50">QA & Software Engineers</td>
                <td className="py-4 px-6 text-center text-sm text-zinc-500">Data Scientists</td>
              </tr>
              <tr className="border-b border-zinc-100">
                <td className="py-4 px-6 text-sm text-zinc-600">Language</td>
                <td className="py-4 px-6 text-center text-sm font-medium text-zinc-900 bg-zinc-50/50">TypeScript / Node.js</td>
                <td className="py-4 px-6 text-center text-sm text-zinc-500">Python</td>
              </tr>
              <tr className="border-b border-zinc-100">
                <td className="py-4 px-6 text-sm text-zinc-600">Testing Style</td>
                <td className="py-4 px-6 text-center text-sm font-medium text-zinc-900 bg-zinc-50/50">Black-box (API-driven)</td>
                <td className="py-4 px-6 text-center text-sm text-zinc-500">White-box (Pipeline-driven)</td>
              </tr>
              <tr className="border-b border-zinc-100">
                <td className="py-4 px-6 text-sm text-zinc-600">Integration</td>
                <td className="py-4 px-6 text-center text-sm font-medium text-zinc-900 bg-zinc-50/50">CI/CD Ready (npx)</td>
                <td className="py-4 px-6 text-center text-sm text-zinc-500">Notebooks / Python Scripts</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to test your RAG pipeline?
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Join the open beta and start evaluating your AI in under 5 minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/docs/quick-start"
              className="px-8 py-3 bg-white text-zinc-900 rounded-lg font-medium hover:bg-zinc-100 transition-colors"
            >
              Get Started Now
            </Link>
            <Link
              href="https://github.com/priyanshus/evaliphy"
              className="px-8 py-3 border border-zinc-700 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              Star on GitHub
            </Link>
          </div>
          <div className="pt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg font-mono text-sm text-zinc-300">
              <span className="text-zinc-500">$</span>
              <span>npm install -g evaliphy</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
