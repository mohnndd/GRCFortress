import { BrandIcon } from '../../components/BrandIcon';
import './Terms.css';

export function TermsPage() {
  return (
    <div className="terms-page">
      <header className="terms-header">
        <div className="terms-brand">
          <BrandIcon size={36} />
          <span>GRC Fortress</span>
        </div>
      </header>

      <article className="terms-content">
        <h1>Terms &amp; Conditions</h1>
        <p className="terms-effective">Effective date: 1 January 2026 · Version 1.0</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the GRC Fortress platform ("Platform"), you agree to be bound by these Terms &amp;
            Conditions ("Terms"). If you do not agree to these Terms, you must not use the Platform. These Terms apply
            to all users, including administrators, compliance officers, auditors, reviewers, and employees.
          </p>
        </section>

        <section>
          <h2>2. Authorized Use</h2>
          <p>
            Access to the Platform is granted exclusively to authorized personnel within your organization. You must:
          </p>
          <ul>
            <li>Use the Platform solely for legitimate governance, risk, and compliance management purposes.</li>
            <li>Protect your credentials and not share them with any other person.</li>
            <li>Report any suspected unauthorized access or security incident immediately to your system administrator.</li>
            <li>Comply with all applicable laws, regulations, and internal policies when using the Platform.</li>
          </ul>
        </section>

        <section>
          <h2>3. Data Responsibility</h2>
          <p>
            Your organization is the data controller for all information entered into the Platform. GRC Fortress
            processes this data solely in accordance with your organization's instructions. You are responsible for
            ensuring that data entered is accurate, complete, and handled in accordance with applicable data protection
            legislation, including the Saudi Personal Data Protection Law (PDPL) and any other relevant regulations.
          </p>
        </section>

        <section>
          <h2>4. Confidentiality</h2>
          <p>
            All information accessible through the Platform is confidential and proprietary to your organization.
            You must not disclose, reproduce, or transmit any Platform content to unauthorized third parties. This
            obligation survives termination of your access to the Platform.
          </p>
        </section>

        <section>
          <h2>5. Security Obligations</h2>
          <p>
            The Platform employs industry-standard security controls including AES-256-GCM encryption of sensitive data,
            multi-factor authentication (MFA), and role-based access control (RBAC). You acknowledge that:
          </p>
          <ul>
            <li>You must complete MFA enrollment before accessing non-public features.</li>
            <li>Development bypass codes (if any) must be disabled before any production or audited deployment.</li>
            <li>You must not attempt to circumvent any security control implemented in the Platform.</li>
          </ul>
        </section>

        <section>
          <h2>6. Audit Trail &amp; Monitoring</h2>
          <p>
            All actions performed within the Platform are logged for audit and compliance purposes. By using the
            Platform, you consent to the collection and retention of activity logs as required by applicable regulatory
            frameworks, including Saudi Arabian Monetary Authority (SAMA) Cyber Security Framework requirements.
          </p>
        </section>

        <section>
          <h2>7. Intellectual Property</h2>
          <p>
            The Platform, including all software, design, documentation, and content, is proprietary. All rights are
            reserved. No licence is granted beyond the right to use the Platform for its intended purpose within your
            organization.
          </p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, GRC Fortress shall not be liable for any indirect,
            incidental, special, or consequential damages arising from your use of or inability to use the Platform.
            The Platform is provided for operational support purposes and does not constitute legal, financial, or
            regulatory compliance advice.
          </p>
        </section>

        <section>
          <h2>9. Modifications</h2>
          <p>
            These Terms may be updated from time to time. Continued use of the Platform following notification of
            changes constitutes acceptance of the revised Terms. Material changes will be communicated through the
            Platform or by email to registered administrators.
          </p>
        </section>

        <section>
          <h2>10. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia.
            Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the competent
            courts of the Kingdom of Saudi Arabia.
          </p>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>
            For questions regarding these Terms, please contact your organization's GRC Fortress system administrator
            or designated compliance officer.
          </p>
        </section>
      </article>

      <footer className="terms-footer">
        <p>© {new Date().getFullYear()} GRC Fortress. All rights reserved.</p>
        <a href="/login">← Back to sign in</a>
      </footer>
    </div>
  );
}
