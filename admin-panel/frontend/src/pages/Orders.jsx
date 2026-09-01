import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { ordersAPI } from '../services/api';
import './Orders.css';

const DEFAULT_PER_PAGE = 25;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filterText.trim()), 400);
    return () => clearTimeout(t);
  }, [filterText]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, perPage]);

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = { page, limit: perPage };
      if (debouncedSearch) {
        params.q = debouncedSearch;
      }

      const response = await ordersAPI.getAll(params);

      if (response.data.success) {
        const baseSerial = (page - 1) * perPage;
        const transformedOrders = response.data.data.map((order, index) => ({
          serialNo: baseSerial + index + 1,
          orderId: order.id,
          orderNumber: order.orderNumber || `ORD-${order.id}`,
          className: order.className || '—',
          sectionName: order.sectionName || '—',
          amount: order.orderTotal || 0,
          studentName: order.studentName || '—',
          customerContact: order.customerContact || '—',
          dateCreated: order.dateCreated || '—',
        }));
        setOrders(transformedOrders);
        setTotalRows(response.data.total ?? transformedOrders.length);
      } else {
        setError(response.data.message || 'Failed to load orders');
        setOrders([]);
        setTotalRows(0);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
      setTotalRows(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, debouncedSearch]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePerRowsChange = (newPerPage, newPage) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const subHeaderComponentMemo = useMemo(
    () => (
      <OrderSearchBar
        filterText={filterText}
        setFilterText={setFilterText}
        debouncedSearch={debouncedSearch}
      />
    ),
    [filterText, debouncedSearch]
  );

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const columns = [
    {
      name: 'S no#',
      selector: (row) => row.serialNo,
      width: '72px',
      center: true,
    },
    {
      name: 'Order ID',
      selector: (row) => row.orderNumber,
      minWidth: '130px',
      wrap: true,
    },
    {
      name: 'Class',
      selector: (row) => row.className,
      minWidth: '90px',
      wrap: true,
    },
    {
      name: 'Section',
      selector: (row) => row.sectionName,
      minWidth: '90px',
      wrap: true,
    },
    {
      name: 'Amount',
      selector: (row) => row.amount,
      minWidth: '110px',
      cell: (row) => formatCurrency(row.amount),
    },
    {
      name: 'Student Name',
      selector: (row) => row.studentName,
      minWidth: '130px',
      wrap: true,
    },
    {
      name: 'Customer Contact',
      selector: (row) => row.customerContact,
      minWidth: '140px',
      wrap: true,
    },
    {
      name: 'Date',
      selector: (row) => row.dateCreated,
      minWidth: '150px',
      wrap: true,
    },
    {
      name: 'Action',
      cell: (row) => (
        <Link
          to={`/get-order-details?orderId=${row.orderId}`}
          className="btn btn-sm btn-primary"
        >
          View
        </Link>
      ),
      ignoreRowClick: true,
      width: '90px',
      center: true,
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#36b9cc',
        color: '#fff',
        fontWeight: 600,
      },
    },
    headCells: {
      style: {
        fontSize: '0.8rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04rem',
        whiteSpace: 'nowrap',
      },
    },
    cells: {
      style: {
        fontSize: '0.875rem',
      },
    },
    table: {
      style: {
        minWidth: '960px',
      },
    },
  };

  return (
    <div className="container-fluid orders-page">
      <div className="header d-flex justify-content-between align-items-center">
        <h1 className="header-title">Customer Orders</h1>
      </div>

      <OrdersExportPanel />

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-info">
              <h5 className="card-title mb-0 text-white">Order List</h5>
            </div>
            <div className="card-body">
              {error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={loadOrders}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={orders}
                  pagination
                  paginationServer
                  paginationTotalRows={totalRows}
                  paginationDefaultPage={page}
                  paginationPerPage={perPage}
                  onChangePage={handlePageChange}
                  onChangeRowsPerPage={handlePerRowsChange}
                  subHeader
                  subHeaderComponent={subHeaderComponentMemo}
                  persistTableHead
                  highlightOnHover
                  striped
                  customStyles={customStyles}
                  paginationRowsPerPageOptions={[10, 25, 50, 100]}
                  noDataComponent="No orders found"
                  progressPending={isLoading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function OrdersExportPanel() {
  const [mode, setMode] = useState('single');
  const [singleDate, setSingleDate] = useState(() => todayYmd());
  const [singleFromTime, setSingleFromTime] = useState('');
  const [singleToTime, setSingleToTime] = useState('');
  const [fromDate, setFromDate] = useState(() => todayYmd());
  const [toDate, setToDate] = useState(() => todayYmd());
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState(null);

  const parseExportError = async (err) => {
    const data = err.response?.data;
    if (data?.message) return data.message;
    if (data instanceof Blob) {
      try {
        const text = await data.text();
        const parsed = JSON.parse(text);
        if (parsed.message) return parsed.message;
      } catch (_) {
        /* ignore */
      }
    }
    return 'Export failed. Please try again.';
  };

  const appendTimeParams = (params, startTime, endTime) => {
    if (startTime) params.fromTime = startTime;
    if (endTime) params.toTime = endTime;
    return params;
  };

  const handleExport = async () => {
    setExportMessage(null);
    const params =
      mode === 'single'
        ? appendTimeParams({ date: singleDate }, singleFromTime, singleToTime)
        : appendTimeParams(
            { from: fromDate, to: toDate || fromDate },
            fromTime,
            toTime
          );

    if (mode === 'single' && !singleDate) {
      setExportMessage('Please select a date.');
      return;
    }
    if (mode === 'range' && !fromDate) {
      setExportMessage('Please select a start date.');
      return;
    }

    try {
      setIsExporting(true);
      const response = await ordersAPI.exportExcel(params);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = response.headers['content-disposition'] || '';
      const match = /filename="?([^"]+)"?/i.exec(disposition);
      const fallback =
        mode === 'single'
          ? `orders_${singleDate}.xlsx`
          : `orders_${fromDate}_to_${toDate || fromDate}.xlsx`;
      a.download = match ? match[1] : fallback;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const count = response.headers['x-export-order-count'];
      setExportMessage(
        count != null
          ? `Downloaded Excel with ${count} order(s).`
          : 'Download started.'
      );
    } catch (err) {
      console.error('Export orders:', err);
      setExportMessage(await parseExportError(err));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="row orders-export-row">
      <div className="col-12">
        <div className="card orders-export-card mb-3">
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <h5 className="card-title mb-0">Export orders to Excel</h5>
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting…' : 'Download Excel'}
              </button>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
              <div className="form-check form-check-inline mb-0">
                <input
                  className="form-check-input"
                  type="radio"
                  name="exportDateMode"
                  id="exportModeSingle"
                  checked={mode === 'single'}
                  onChange={() => setMode('single')}
                />
                <label className="form-check-label" htmlFor="exportModeSingle">
                  Single date
                </label>
              </div>
              <div className="form-check form-check-inline mb-0">
                <input
                  className="form-check-input"
                  type="radio"
                  name="exportDateMode"
                  id="exportModeRange"
                  checked={mode === 'range'}
                  onChange={() => setMode('range')}
                />
                <label className="form-check-label" htmlFor="exportModeRange">
                  Date range
                </label>
              </div>
            </div>

            {mode === 'single' ? (
              <div className="d-flex flex-wrap align-items-end gap-3">
                <div>
                  <label className="form-label small mb-1" htmlFor="exportSingleDate">
                    Order date
                  </label>
                  <input
                    id="exportSingleDate"
                    type="date"
                    className="form-control form-control-sm"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label small mb-1" htmlFor="exportSingleFromTime">
                    From time <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    id="exportSingleFromTime"
                    type="time"
                    className="form-control form-control-sm"
                    value={singleFromTime}
                    onChange={(e) => setSingleFromTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label small mb-1" htmlFor="exportSingleToTime">
                    To time <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    id="exportSingleToTime"
                    type="time"
                    className="form-control form-control-sm"
                    value={singleToTime}
                    onChange={(e) => setSingleToTime(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="d-flex flex-wrap align-items-end gap-3">
                <div>
                  <label className="form-label small mb-1" htmlFor="exportFromDate">
                    From date
                  </label>
                  <input
                    id="exportFromDate"
                    type="date"
                    className="form-control form-control-sm"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label small mb-1" htmlFor="exportRangeFromTime">
                    From time <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    id="exportRangeFromTime"
                    type="time"
                    className="form-control form-control-sm"
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label small mb-1" htmlFor="exportToDate">
                    To date
                  </label>
                  <input
                    id="exportToDate"
                    type="date"
                    className="form-control form-control-sm"
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label small mb-1" htmlFor="exportRangeToTime">
                    To time <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    id="exportRangeToTime"
                    type="time"
                    className="form-control form-control-sm"
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            <p className="text-muted small mb-0 mt-2">
              Excel includes two sheets: order summary and line items. Leave times empty for full
              days. Maximum date span: 1 year.
            </p>
            {exportMessage ? (
              <p
                className={`small mb-0 mt-2 ${
                  exportMessage.includes('failed') || exportMessage.includes('Please')
                    ? 'text-danger'
                    : 'text-success'
                }`}
              >
                {exportMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSearchBar({ filterText, setFilterText, debouncedSearch }) {
  return (
    <div className="dataTables_filter d-flex flex-wrap align-items-center gap-2">
      <label className="mb-0">
        Search:
        <input
          type="search"
          className="form-control form-control-sm"
          placeholder="Order ID, student, contact…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{
            marginLeft: '0.5rem',
            display: 'inline-block',
            width: 'auto',
            minWidth: '220px',
          }}
        />
      </label>
      {debouncedSearch ? (
        <span className="text-muted small">Searching all orders…</span>
      ) : null}
    </div>
  );
}

export default Orders;
