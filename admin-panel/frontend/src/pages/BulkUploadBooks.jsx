import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { booksAPI, schoolsAPI, gradesAPI, subgradesAPI } from '../services/api';
import './BulkUploadBooks.css';

const BOOK_TYPES_HELP = [
  { value: 'TEXTBOOK', label: 'Mandatory Textbook' },
  { value: 'NOTEBOOK', label: 'Notebook' },
  { value: 'MANDATORY_NOTEBOOK', label: 'Mandatory Notebook' },
  { value: 'STATIONARY', label: 'Stationary' },
  { value: 'UNIFORM', label: 'Uniform' },
  { value: 'OPTIONAL_1', label: 'School suggested' },
  { value: 'OPTIONAL_2', label: 'Optional' },
  { value: 'OTHER', label: 'Other' },
];

const BulkUploadBooks = () => {
  const [schools, setSchools] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subgrades, setSubgrades] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [subgradeId, setSubgradeId] = useState('');
  const [file, setFile] = useState(null);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingSubgrades, setLoadingSubgrades] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    const loadSchools = async () => {
      try {
        setLoadingSchools(true);
        const res = await schoolsAPI.getAll();
        if (res.data.success) {
          setSchools(res.data.data || []);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load schools');
      } finally {
        setLoadingSchools(false);
      }
    };
    loadSchools();
  }, []);

  useEffect(() => {
    if (!schoolId) {
      setGrades([]);
      setGradeId('');
      setSubgrades([]);
      setSubgradeId('');
      return;
    }
    const loadGrades = async () => {
      try {
        setLoadingGrades(true);
        setGradeId('');
        setSubgrades([]);
        setSubgradeId('');
        const res = await gradesAPI.getAll(schoolId);
        if (res.data.success) {
          setGrades(res.data.data || []);
        } else {
          setGrades([]);
        }
      } catch (e) {
        console.error(e);
        setGrades([]);
      } finally {
        setLoadingGrades(false);
      }
    };
    loadGrades();
  }, [schoolId]);

  useEffect(() => {
    if (!gradeId) {
      setSubgrades([]);
      setSubgradeId('');
      return;
    }
    const loadSubgrades = async () => {
      try {
        setLoadingSubgrades(true);
        setSubgradeId('');
        const res = await subgradesAPI.getAll(gradeId);
        if (res.data.success) {
          setSubgrades(res.data.data || []);
        } else {
          setSubgrades([]);
        }
      } catch (e) {
        console.error(e);
        setSubgrades([]);
      } finally {
        setLoadingSubgrades(false);
      }
    };
    loadSubgrades();
  }, [gradeId]);

  const schoolLabel = useMemo(() => {
    const s = schools.find((x) => x.id === schoolId);
    if (!s) return '';
    return s.name + (s.branchName ? ` - ${s.branchName}` : '');
  }, [schools, schoolId]);

  const gradeLabel = useMemo(() => {
    const g = grades.find((x) => x.id === gradeId);
    return g?.name || '';
  }, [grades, gradeId]);

  const resetResults = () => {
    setPreview(null);
    setImportResult(null);
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const next = e.target.files?.[0] || null;
    setFile(next);
    resetResults();
  };

  const downloadTemplate = async () => {
    try {
      setError('');
      const res = await booksAPI.downloadBulkTemplate();
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk-books-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Failed to download template');
    }
  };

  const runUpload = async (dryRun) => {
    if (!schoolId || !gradeId) {
      setError('Please select School and Grade');
      return;
    }
    if (!file) {
      setError('Please choose an Excel or CSV file');
      return;
    }

    try {
      if (dryRun) {
        setPreviewing(true);
        setImportResult(null);
      } else {
        setImporting(true);
      }
      setError('');
      setSuccess('');

      const res = await booksAPI.bulkImport({
        file,
        schoolId,
        gradeId,
        subgradeId: subgradeId || undefined,
        dryRun,
      });

      if (!res.data.success) {
        setError(res.data.message || 'Upload failed');
        return;
      }

      if (dryRun) {
        setPreview(res.data.data);
        setSuccess(
          `Preview: ${res.data.data.validCount} valid row(s), ${res.data.data.invalidCount} with errors`
        );
      } else {
        setImportResult(res.data.data);
        setPreview(null);
        setSuccess(res.data.message || 'Import complete');
        setFile(null);
        const input = document.getElementById('bulk-file-input');
        if (input) input.value = '';
      }
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || e.message || 'Upload failed');
    } finally {
      setPreviewing(false);
      setImporting(false);
    }
  };

  const rowsToShow = preview?.rows || [];

  return (
    <div className="bulk-upload-page">
      <div className="header">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h1 className="header-title mb-0">Bulk Upload Products</h1>
          <div className="d-flex gap-2">
            <Link to="/get-all-books" className="btn btn-light btn-sm">
              Back to Products
            </Link>
            <button type="button" className="btn btn-outline-light btn-sm" onClick={downloadTemplate}>
              Download Excel template
            </button>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header bg-primary text-white">
          <strong>1. Select school &amp; grade</strong>
        </div>
        <div className="card-body">
          <p className="text-muted small mb-3">
            All products in the file will be created under the school and grade you select here.
            Optional: pick a default section for rows that leave Section blank.
          </p>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">School *</label>
              <select
                className="form-control"
                value={schoolId}
                disabled={loadingSchools}
                onChange={(e) => {
                  setSchoolId(e.target.value);
                  resetResults();
                }}
              >
                <option value="">Select school</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.branchName ? ` - ${s.branchName}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Grade *</label>
              <select
                className="form-control"
                value={gradeId}
                disabled={!schoolId || loadingGrades}
                onChange={(e) => {
                  setGradeId(e.target.value);
                  resetResults();
                }}
              >
                <option value="">Select grade</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Default section (optional)</label>
              <select
                className="form-control"
                value={subgradeId}
                disabled={!gradeId || loadingSubgrades}
                onChange={(e) => {
                  setSubgradeId(e.target.value);
                  resetResults();
                }}
              >
                <option value="">None — use Section column in Excel if needed</option>
                {subgrades.map((sg) => (
                  <option key={sg.id} value={sg.id}>
                    {sg.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {schoolId && gradeId ? (
            <p className="mt-3 mb-0 small text-success">
              Uploading into: <strong>{schoolLabel}</strong> / <strong>{gradeLabel}</strong>
            </p>
          ) : null}
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header bg-primary text-white">
          <strong>2. Upload Excel / CSV</strong>
        </div>
        <div className="card-body">
          <input
            id="bulk-file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="form-control"
            onChange={handleFileChange}
          />
          {file ? (
            <p className="small text-muted mt-2 mb-0">Selected: {file.name}</p>
          ) : null}

          <div className="mt-3 d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={previewing || importing}
              onClick={() => runUpload(true)}
            >
              {previewing ? 'Checking…' : 'Preview rows'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={previewing || importing || !preview || preview.validCount < 1}
              onClick={() => runUpload(false)}
            >
              {importing
                ? 'Importing…'
                : `Confirm import${preview?.validCount ? ` (${preview.validCount})` : ''}`}
            </button>
          </div>

          {error ? <div className="alert alert-danger mt-3 mb-0">{error}</div> : null}
          {success ? <div className="alert alert-success mt-3 mb-0">{success}</div> : null}
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">
          <strong>BookType values</strong>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Value in Excel</th>
                  <th>Meaning</th>
                </tr>
              </thead>
              <tbody>
                {BOOK_TYPES_HELP.map((t) => (
                  <tr key={t.value}>
                    <td>
                      <code>{t.value}</code>
                    </td>
                    <td>{t.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {preview ? (
        <div className="card mb-3">
          <div className="card-header bg-info text-white">
            <strong>
              Preview — {preview.validCount} valid / {preview.invalidCount} invalid (of{' '}
              {preview.totalRows})
            </strong>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-sm table-striped mb-0 preview-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Status</th>
                    <th>Title</th>
                    <th>ISBN</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Type</th>
                    <th>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsToShow.map((row) => (
                    <tr key={row.rowNumber} className={row.valid ? '' : 'table-danger'}>
                      <td>{row.rowNumber}</td>
                      <td>{row.valid ? 'OK' : 'Error'}</td>
                      <td>{row.title || '—'}</td>
                      <td>{row.isbn || '—'}</td>
                      <td>{row.price != null ? row.price : '—'}</td>
                      <td>{row.stockQuantity != null ? row.stockQuantity : '—'}</td>
                      <td>{row.bookType || '—'}</td>
                      <td className="small">{(row.errors || []).join('; ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {importResult ? (
        <div className="card mb-3">
          <div className="card-header bg-success text-white">
            <strong>
              Import result — created {importResult.createdCount}, skipped{' '}
              {importResult.invalidCount}
            </strong>
          </div>
          <div className="card-body">
            {importResult.created?.length ? (
              <div className="mb-3">
                <h6>Created</h6>
                <ul className="small mb-0">
                  {importResult.created.slice(0, 50).map((c) => (
                    <li key={c.id}>
                      Row {c.rowNumber}: {c.title} ({c.isbn})
                    </li>
                  ))}
                  {importResult.created.length > 50 ? (
                    <li>…and {importResult.created.length - 50} more</li>
                  ) : null}
                </ul>
              </div>
            ) : null}
            {importResult.failed?.length ? (
              <div>
                <h6>Skipped</h6>
                <ul className="small mb-0 text-danger">
                  {importResult.failed.map((f) => (
                    <li key={`${f.rowNumber}-${f.isbn}`}>
                      Row {f.rowNumber}: {f.title || f.isbn} — {(f.errors || []).join('; ')}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Link to="/get-all-books" className="btn btn-primary btn-sm mt-3">
              View all products
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BulkUploadBooks;
