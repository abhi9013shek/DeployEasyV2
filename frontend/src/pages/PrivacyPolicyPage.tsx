import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link to="/" className="text-sm text-palette-terracotta hover:underline">
            &larr; Back to DeployEasy
          </Link>
          <h1 className="text-3xl font-bold mt-4 text-white">Privacy Policy</h1>
          <p className="text-sm text-surface-400 mt-1">Effective Date: September 29, 2026</p>
        </div>

        <div className="space-y-6 text-surface-300 text-sm leading-relaxed border-t border-surface-800 pt-6">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
            <p>
              DeployEasy collects minimal operational information necessary to provide application deployment services. When you authenticate using GitHub, we store your GitHub identifier, username, email address, and avatar URL.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. How We Use Information</h2>
            <p>
              Collected data is strictly used to authenticate your session, associate project deployments with your account, and deliver real-time deployment status updates. We do not sell or monetize personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Third-Party Authentication</h2>
            <p>
              Authentication is managed through GitHub OAuth 2.0. We request read-only access to user profile information and primary verified email addresses.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Data Security</h2>
            <p>
              Session credentials are encrypted and stored in HTTP-only cookies. Access tokens and project configuration parameters are encrypted in our persistent database storage.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Contact</h2>
            <p>
              For privacy concerns or data access requests, please contact privacy@deployeasy.app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
