import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  const effectiveDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-8"
        >
          <ArrowLeft size={20} />
          <span>Back to BillSplit</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Effective Date: {effectiveDate}</p>

          <div className="prose prose-gray max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Welcome to BillSplit.me! This Privacy Policy explains how we collect, use, 
              and protect your information when you use our website.
            </p>

            <h2>2. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul>
              <li>
                <strong>Receipt Data:</strong> When you upload receipts, we process them 
                to extract bill details. This data is processed in your browser and is 
                not stored on our servers.
              </li>
              <li>
                <strong>Usage Data:</strong> We collect anonymous usage data through 
                Google Analytics to understand how users interact with our site.
              </li>
              <li>
                <strong>Cookies & Local Storage:</strong> We use cookies and local 
                storage for:
                <ul>
                  <li>Remembering your cookie consent preferences</li>
                  <li>Google Analytics tracking</li>
                  <li>Google AdSense personalization</li>
                </ul>
              </li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use your data to:</p>
            <ul>
              <li>Process and split bills accurately</li>
              <li>Improve our website's functionality and user experience</li>
              <li>Display relevant advertisements through Google AdSense</li>
              <li>Analyze site traffic and usage patterns</li>
            </ul>

            <h2>4. Google AdSense & Analytics</h2>
            <p>
              We use Google AdSense to display advertisements and Google Analytics to 
              analyze site usage. These services may use cookies to:
            </p>
            <ul>
              <li>Show personalized advertisements</li>
              <li>Measure ad performance</li>
              <li>Track user interactions</li>
            </ul>
            <p>
              You can opt out of personalized advertising by visiting{' '}
              <a 
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Ad Settings
              </a>.
            </p>

            <h2>5. Data Security</h2>
            <p>
              We prioritize your data security by:
            </p>
            <ul>
              <li>Processing receipt data locally in your browser</li>
              <li>Not storing personal information on our servers</li>
              <li>Using secure HTTPS connections</li>
            </ul>

            <h2>6. Your Rights (GDPR & CCPA)</h2>
            <p>Under GDPR and CCPA, you have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Request data deletion</li>
              <li>Opt out of data collection</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2>7. Children's Privacy</h2>
            <p>
              Our service is not directed to children under 13. We do not knowingly 
              collect personal information from children under 13.
            </p>

            <h2>8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. The latest version will 
              always be available on this page.
            </p>

            <h2>9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:{' '}
              <a 
                href="mailto:hello@smbee.me"
                className="text-primary hover:underline"
              >
                hello@smbee.me
              </a>
            </p>
          </div>
        </div>

        {/* Bottom back button */}
        <div className="mt-8 text-center">
          <Link 
            to="/"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>Back to BillSplit</span>
          </Link>
        </div>
      </div>
    </div>
  );
}