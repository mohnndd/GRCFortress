import { useState } from 'react';
import './TermsConditions.css';

type TermsStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

interface TermsDocument {
  id: number;
  documentNumber: string;
  product: string;
  title: string;
  owner: string;
  status: TermsStatus;
  version: string;
  updatedAt: string;
  nextReview: string;
  description: string;
}

const TERMS_DOCUMENTS: TermsDocument[] = [
  {
    id: 1,
    documentNumber: 'TC-2026-001',
    product: 'Retail Banking Mobile App',
    title: 'Customer Terms and Conditions',
    owner: 'Legal',
    status: 'IN_REVIEW',
    version: '2.4',
    updatedAt: '2026-06-12',
    nextReview: '2026-06-25',
    description: 'Customer-facing terms for retail mobile banking services and account access.',
  },
  {
    id: 2,
    documentNumber: 'TC-2026-002',
    product: 'Corporate Portal',
    title: 'Online Services Terms',
    owner: 'Compliance',
    status: 'DRAFT',
    version: '1.1',
    updatedAt: '2026-06-08',
    nextReview: '2026-06-30',
    description: 'Terms governing corporate user access, electronic instructions, and portal usage.',
  },
  {
    id: 3,
    documentNumber: 'TC-2026-003',
    product: 'Payment Gateway',
    title: 'Merchant Terms',
    owner: 'Product Risk',
    status: 'PUBLISHED',
    version: '3.0',
    updatedAt: '2026-05-28',
    nextReview: '2026-08-28',
    description: 'Merchant obligations, settlement terms, chargeback rules, and service limitations.',
  },
];

const WORKFLOW_STEPS = [
  'Draft',
  'Legal review',
  'Compliance review',
  'Approval',
  'Published',
];

function statusLabel(status: TermsStatus) {
  const map: Record<TermsStatus, string> = {
    DRAFT: 'Draft',
    IN_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    PUBLISHED: 'Published',
    ARCHIVED: 'Archived',
  };
  return map[status];
}

function statusClass(status: TermsStatus) {
  const map: Record<TermsStatus, string> = {
    DRAFT: 'badge-draft',
    IN_REVIEW: 'badge-review',
    APPROVED: 'badge-approved',
    PUBLISHED: 'badge-approved',
    ARCHIVED: 'badge-archived',
  };
  return map[status];
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function TermsConditionsPage() {
  const [selectedDocument, setSelectedDocument] = useState<TermsDocument | null>(null);
  const [drawerMode, setDrawerMode] = useState<'new' | 'detail' | null>(null);

  function openNew() {
    setSelectedDocument(null);
    setDrawerMode('new');
  }

  function openDetail(document: TermsDocument) {
    setSelectedDocument(document);
    setDrawerMode('detail');
  }

  return (
    <div className={`tc-page${drawerMode ? ' tc-page--with-drawer' : ''}`}>
      <div className="tc-main">
        <div className="tc-header">
          <div>
            <h2>Terms and Conditions</h2>
            <p className="tc-subtitle">
              Draft, version, and manage approval workflows for product-facing terms.
            </p>
          </div>
          <button className="tc-btn-primary" onClick={openNew}>+ New terms document</button>
        </div>

        <table className="tc-table">
          <thead>
            <tr>
              <th>Document #</th>
              <th>Title</th>
              <th>Product</th>
              <th>Owner</th>
              <th>Version</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {TERMS_DOCUMENTS.map((document) => (
              <tr
                key={document.id}
                className={`tc-table-row${selectedDocument?.id === document.id ? ' tc-table-row--selected' : ''}`}
                onClick={() => openDetail(document)}
              >
                <td className="tc-col-number">{document.documentNumber}</td>
                <td className="tc-col-title">{document.title}</td>
                <td className="tc-col-category">{document.product}</td>
                <td className="tc-col-owner">{document.owner}</td>
                <td className="tc-col-version">v{document.version}</td>
                <td className="tc-col-status">
                  <span className={`tc-badge ${statusClass(document.status)}`}>{statusLabel(document.status)}</span>
                </td>
                <td className="tc-col-updated">{relativeDate(document.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawerMode && (
        <div className="tc-drawer">
          <div className="tc-drawer-header">
            <h3>{drawerMode === 'new' ? 'New Terms Document' : (selectedDocument?.title ?? 'Terms document')}</h3>
            <button className="tc-drawer-close" onClick={() => setDrawerMode(null)}>X</button>
          </div>

          {drawerMode === 'new' && (
            <div className="tc-drawer-body">
              <div className="tc-empty-form">
                <h4>Document setup</h4>
                <p>
                  This screen is ready for the same upload/version workflow used by Policy Management.
                </p>
                <button className="tc-btn-primary">Create draft</button>
              </div>
            </div>
          )}

          {drawerMode === 'detail' && selectedDocument && (
            <div className="tc-drawer-body">
              <section className="tc-detail-section">
                <span className={`tc-badge ${statusClass(selectedDocument.status)}`}>
                  {statusLabel(selectedDocument.status)}
                </span>
                <h4>{selectedDocument.documentNumber}</h4>
                <p>{selectedDocument.description}</p>
              </section>

              <section className="tc-detail-grid">
                <div>
                  <span>Product</span>
                  <strong>{selectedDocument.product}</strong>
                </div>
                <div>
                  <span>Owner</span>
                  <strong>{selectedDocument.owner}</strong>
                </div>
                <div>
                  <span>Version</span>
                  <strong>v{selectedDocument.version}</strong>
                </div>
                <div>
                  <span>Next review</span>
                  <strong>{selectedDocument.nextReview}</strong>
                </div>
              </section>

              <section className="tc-detail-section">
                <h4>Approval flow</h4>
                <ol className="tc-workflow">
                  {WORKFLOW_STEPS.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
