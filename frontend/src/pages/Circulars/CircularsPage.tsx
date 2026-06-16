import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { listDepartments, type Department } from '../../api/departmentApi';
import './Circulars.css';

interface CircularItem {
  id: string;
  issuer: string;
  description: string;
  departmentId: number | null;
  createdAt: string;
}

const INITIAL_CIRCULARS: CircularItem[] = [
  {
    id: 'CIR-001',
    issuer: 'Central Bank Compliance Circular',
    description: 'Updated guidance for customer communication retention and compliance review evidence.',
    departmentId: null,
    createdAt: '2026-06-16',
  },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(iso));
}

export function CircularsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [circulars, setCirculars] = useState<CircularItem[]>(INITIAL_CIRCULARS);
  const [selectedCircular, setSelectedCircular] = useState<CircularItem | null>(INITIAL_CIRCULARS[0]);
  const [drawerMode, setDrawerMode] = useState<'new' | 'detail' | null>('detail');
  const [issuer, setIssuer] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departmentError, setDepartmentError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDepartments() {
      try {
        setDepartments(await listDepartments());
      } catch {
        setDepartmentError('Department list is unavailable. Circulars can still be drafted.');
      }
    }

    loadDepartments();
  }, []);

  const departmentById = useMemo(() => {
    return new Map(departments.map((department) => [department.id, department]));
  }, [departments]);

  function departmentName(id: number | null) {
    if (!id) return 'All / not applicable';
    return departmentById.get(id)?.name ?? 'Department unavailable';
  }

  function openNew() {
    setIssuer('');
    setDescription('');
    setDepartmentId('');
    setSelectedCircular(null);
    setDrawerMode('new');
  }

  function openDetail(circular: CircularItem) {
    setSelectedCircular(circular);
    setDrawerMode('detail');
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextCircular: CircularItem = {
      id: `CIR-${String(circulars.length + 1).padStart(3, '0')}`,
      issuer: issuer.trim(),
      description: description.trim(),
      departmentId: departmentId ? Number(departmentId) : null,
      createdAt: new Date().toISOString(),
    };
    setCirculars((current) => [nextCircular, ...current]);
    setSelectedCircular(nextCircular);
    setDrawerMode('detail');
  }

  return (
    <div className={`circulars-page${drawerMode ? ' circulars-page--with-drawer' : ''}`}>
      <div className="circulars-main">
        <div className="circulars-header">
          <div>
            <h2>Circulars</h2>
            <p className="circulars-subtitle">
              Capture regulatory, internal, and external circulars with issuer and concerned department context.
            </p>
          </div>
          <button className="circulars-btn-primary" onClick={openNew}>+ New circular</button>
        </div>

        <table className="circulars-table">
          <thead>
            <tr>
              <th>Circular #</th>
              <th>Issuer</th>
              <th>Description</th>
              <th>Concerned department</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {circulars.map((circular) => (
              <tr
                key={circular.id}
                className={`circulars-table-row${
                  selectedCircular?.id === circular.id ? ' circulars-table-row--selected' : ''
                }`}
                onClick={() => openDetail(circular)}
              >
                <td className="circulars-col-number">{circular.id}</td>
                <td className="circulars-col-issuer">{circular.issuer}</td>
                <td className="circulars-col-description">{circular.description}</td>
                <td className="circulars-col-department">{departmentName(circular.departmentId)}</td>
                <td className="circulars-col-date">{formatDate(circular.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawerMode && (
        <aside className="circulars-drawer">
          <div className="circulars-drawer-header">
            <h3>{drawerMode === 'new' ? 'New Circular' : selectedCircular?.id ?? 'Circular'}</h3>
            <button className="circulars-drawer-close" onClick={() => setDrawerMode(null)}>X</button>
          </div>

          {drawerMode === 'new' && (
            <form className="circulars-drawer-body circulars-form" onSubmit={submit}>
              <label>
                Issuer
                <input value={issuer} onChange={(event) => setIssuer(event.target.value)} required />
              </label>

              <label>
                Concerned department
                <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
                  <option value="">All / not applicable</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={8}
                  required
                />
              </label>

              {departmentError && <p className="circulars-error">{departmentError}</p>}

              <div className="circulars-form-actions">
                <button className="circulars-btn-secondary" type="button" onClick={() => setDrawerMode(null)}>
                  Cancel
                </button>
                <button className="circulars-btn-primary" type="submit">
                  Add circular
                </button>
              </div>
            </form>
          )}

          {drawerMode === 'detail' && selectedCircular && (
            <div className="circulars-drawer-body">
              <section className="circulars-detail-section">
                <span className="circulars-badge">Recorded</span>
                <h4>{selectedCircular.issuer}</h4>
                <p>{selectedCircular.description}</p>
              </section>

              <section className="circulars-detail-grid">
                <div>
                  <span>Concerned department</span>
                  <strong>{departmentName(selectedCircular.departmentId)}</strong>
                </div>
                <div>
                  <span>Created</span>
                  <strong>{formatDate(selectedCircular.createdAt)}</strong>
                </div>
              </section>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
