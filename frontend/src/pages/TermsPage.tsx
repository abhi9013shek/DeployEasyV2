import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link to="/" className="text-sm text-palette-terracotta hover:underline">
            &larr; Back to DeployEasy
          </Link>
          <h1 className="text-3xl font-bold mt-4 text-white">Terms & Conditions</h1>
          <p className="text-sm text-surface-400 mt-1">Effective Date: September 29, 2026</p>
        </div>

        <div className="space-y-6 text-surface-300 text-sm leading-relaxed border-t border-surface-800 pt-6">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using DeployEasy, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. Acceptable Use</h2>
            <p>
              You agree not to use DeployEasy to build or deploy malicious code, execute denial-of-service attacks, or violate applicable local and international software laws.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Account Responsibility</h2>
            <p>
              You are responsible for maintaining the security of your GitHub account authentication credentials and for all activities that occur under your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Service Availability</h2>
            <p>
              DeployEasy is provided on an "as is" and "as available" basis without warranties of any kind. We reserve the right to suspend or terminate services for platform maintenance or policy violations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Limitation of Liability</h2>
            <p>
              In no event shall DeployEasy be liable for direct, indirect, incidental, or consequential damages resulting from deployment downtime or loss of data.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
