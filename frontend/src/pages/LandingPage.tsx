import { Link } from 'react-router-dom';
import { Terminal, Server, GitBranch, Cpu, ShieldCheck } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-800 bg-surface-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-palette-terracotta rounded flex items-center justify-center font-bold text-surface-950 text-sm">
              DE
            </div>
            <span className="font-bold text-lg text-white">DeployEasy</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="btn-primary text-sm">
              Sign In with GitHub
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-20 px-6 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-900 border border-surface-800 rounded text-xs font-mono text-palette-sand">
            <span>Production Deployment Automation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Automated Application Deployment Pipeline for Kubernetes
          </h1>

          <p className="text-lg text-surface-300 max-w-2xl mx-auto leading-relaxed">
            Connect your Git repositories, manage environmental configurations, monitor build pipelines, and deploy containerized services with zero manual configuration.
          </p>

          <div className="pt-4 flex items-center justify-center gap-4">
            <Link to="/login" className="btn-primary">
              Connect Repository
            </Link>
            <a href="#features" className="btn-secondary">
              View Architecture
            </a>
          </div>
        </section>

        {/* Product Architecture Features */}
        <section id="features" className="py-16 px-6 max-w-6xl mx-auto border-t border-surface-800">
          <h2 className="text-2xl font-bold text-white text-center mb-12">System Architecture & Capabilities</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-clean p-6 space-y-3">
              <div className="h-10 w-10 bg-surface-800 rounded flex items-center justify-center text-palette-terracotta">
                <GitBranch className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Git Webhook Integration</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Automated build triggering upon code push to designated production and staging branches.
              </p>
            </div>

            <div className="card-clean p-6 space-y-3">
              <div className="h-10 w-10 bg-surface-800 rounded flex items-center justify-center text-palette-sand">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Containerization Pipeline</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Automated OCI container image creation, dependency caching, and registry distribution.
              </p>
            </div>

            <div className="card-clean p-6 space-y-3">
              <div className="h-10 w-10 bg-surface-800 rounded flex items-center justify-center text-palette-gold">
                <Server className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Kubernetes Orchestration</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Declarative manifest deployment, rolling updates, health checks, and automatic rollbacks.
              </p>
            </div>
          </div>
        </section>

        {/* Real Logs / Pipeline Visualizer */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <div className="card-clean p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-surface-400">
                <Terminal className="h-4 w-4 text-palette-terracotta" />
                <span>build-pipeline.log</span>
              </div>
              <span className="text-xs font-mono text-palette-gold bg-surface-900 px-2 py-0.5 rounded border border-surface-700">
                STATUS: SUCCESS
              </span>
            </div>

            <pre className="font-mono text-xs text-surface-300 space-y-1 overflow-x-auto p-4 bg-surface-950 rounded">
              <div>[00:00:01] Fetching repository commit 4b8f9e...</div>
              <div>[00:00:04] Executing build command: npm run build</div>
              <div>[00:00:18] Generating OCI image tag: registry.deployeasy.app/app:v1.4.0</div>
              <div>[00:00:26] Applying Kubernetes manifest: deployment.yaml</div>
              <div>[00:00:32] Readiness probe succeeded (HTTP 200)</div>
              <div className="text-palette-sand font-bold">[00:00:35] Deployment active at https://app.deployeasy.app</div>
            </pre>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-800 bg-surface-900 py-8 px-6 text-sm text-surface-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-surface-500">&copy; 2026 DeployEasy Platform. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
