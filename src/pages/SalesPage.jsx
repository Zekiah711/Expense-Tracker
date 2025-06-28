import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import TopNav from '../components/TopNav';
import DetailsModal from '../components/DetailsModal';
import currency from '../utils/currency';
import { getDatabase, ref, remove, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const LOCAL_KEY = 'todays_sales';

const getTodayFromLocalStorage = () => {
  const data = localStorage.getItem(LOCAL_KEY);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    const today = new Date().toDateString();
    if (parsed.date === today) {
      return parsed.sales;
    }
  } catch {
    return null;
  }

  return null;
};

const saveTodayToLocalStorage = (sales) => {
  const today = new Date().toDateString();
  const payload = {
    date: today,
    sales,
  };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
};

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Today');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const formatAmount = (amount) => Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 });

  useEffect(() => {
    const loadSales = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getDatabase();
      const userSalesRef = ref(db, `sales/${user.uid}`);

      let useCache = false;
      let cached = [];

      if (filter === 'Today' && !search) {
        const local = getTodayFromLocalStorage();
        if (local) {
          cached = local;
          useCache = true;
        }
      }

      try {
        const snapshot = await get(userSalesRef);
        const data = snapshot.val();

        if (!data && useCache) {
          setSales(cached);
          return;
        }

        if (!data) {
          setSales([]);
          return;
        }

        const allSales = Object.entries(data).map(([key, value]) => ({ ...value, _id: key }));
        const today = new Date();
        const startDate = new Date(customRange.start);
        const endDate = new Date(customRange.end);

        const filtered = allSales.filter((entry) => {
          const entryDate = new Date(entry.date);
          const isToday = entryDate.toDateString() === today.toDateString();
          const isThisWeek = (today - entryDate) <= 7 * 24 * 60 * 60 * 1000;
          const isThisMonth = entryDate.getMonth() === today.getMonth() && entryDate.getFullYear() === today.getFullYear();
          const isCustomRange = filter === 'Custom Range' && customRange.start && customRange.end && entryDate >= startDate && entryDate <= endDate;

          const matchesDate =
            filter === 'All Time' ||
            (filter === 'Today' && isToday) ||
            (filter === 'This Week' && isThisWeek) ||
            (filter === 'This Month' && isThisMonth) ||
            isCustomRange;

          const matchesSearch =
            (entry.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (entry.supplier?.toLowerCase() || '').includes(search.toLowerCase());

          return matchesDate && matchesSearch;
        });

        setSales(filtered);

        if (filter === 'Today' && !search) {
          saveTodayToLocalStorage(filtered);
        }
      } catch (err) {
        console.error('Error loading sales:', err);
        if (useCache) {
          setSales(cached);
        }
      }
    };

    loadSales();
  }, [filter, search, customRange]);

  const totalAmount = sales.reduce((total, entry) => {
    const qty = parseFloat(entry.quantity) || 0;
    const price = parseFloat(entry.price) || 0;
    return total + qty * price;
  }, 0).toFixed(2);

  const handleDeleteEntry = async (id) => {
    const toastId = toast.warning(
      <div>
        Are you sure you want to delete this sale?
        <div className="mt-2 d-flex justify-content-end gap-2">
          <button
            className="btn btn-sm btn-danger"
            onClick={async () => {
              toast.dismiss(toastId);
              try {
                const user = getAuth().currentUser;
                if (!user) return;

                const itemRef = ref(getDatabase(), `sales/${user.uid}/${id}`);
                await remove(itemRef);

                setSales(prev => prev.filter(item => item._id !== id));
                toast.success('Sale entry deleted successfully.');

                if (filter === 'Today' && !search) {
                  const updated = sales.filter(item => item._id !== id);
                  saveTodayToLocalStorage(updated);
                }
              } catch (err) {
                toast.error('Failed to delete the sale. Please try again.');
                console.error('Delete Sale Error:', err);
              }
            }}
          >
            Yes, Delete
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => toast.dismiss(toastId)}
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
      }
    );
  };

  return (
    <>
      <TopNav />
      <div className="container d-flex justify-content-center my-4">
        <div className="card shadow p-4" style={{ width: '100%', maxWidth: '600px' }}>
          <h3 className="fw-bold text-center mb-4">My Sales</h3>

          <div
            className="rounded-4 text-white text-center p-4 mb-4"
            style={{
              background: 'linear-gradient(to right, rgb(25, 135, 84), rgb(60, 205, 120))',
              borderRadius: '1.5rem',
              boxShadow: '0 3px 10px rgba(31, 182, 112, 0.5)'
            }}
          >
            <p className="mb-1">Total Sales</p>
            <h2 className="fw-bold">{currency.symbol}{formatAmount(totalAmount)}</h2>
            <small className="text-white-70 fw-semibold">
              {filter === 'All Time' ? 'All Time' : filter}
            </small>
          </div>

          <div className="mb-3">
            <select
              className="form-select mb-2"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>All Time</option>
              <option>Custom Range</option>
            </select>

            {filter === 'Custom Range' && (
              <div className="d-flex gap-2 mb-2">
                <input
                  type="date"
                  className="form-control"
                  value={customRange.start}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                />
                <input
                  type="date"
                  className="form-control"
                  value={customRange.end}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            )}

            <input
              type="text"
              className="form-control mb-2"
              placeholder="Search by item or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0">Sale Entries</h6>
              <span className="badge bg-light text-dark">
                {sales.length} {sales.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>

            {sales.length === 0 && <p className="text-muted">No sales to show.</p>}

            {sales.map((entry) => {
              const qty = parseFloat(entry.quantity) || 0;
              const price = parseFloat(entry.price) || 0;
              const total = qty * price;

              return (
                <div key={entry._id} className="p-3 mb-3 bg-white rounded shadow-sm border">
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong className="mb-1 d-block">{entry.name || 'Unnamed Item'}</strong>
                      <div className="text-muted small mb-2">
                        {entry.supplier || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-success mb-1">
                        {currency.symbol}{formatAmount(total)}
                      </div>
                      <div className="text-muted small">
                        {entry.date ? new Date(entry.date).toDateString() : 'No Date'}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setSelectedEntry(entry);
                        setShowModal(true);
                      }}
                    >
                      Details
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteEntry(entry._id)}
                    >
                      Delete Entry
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DetailsModal
        show={showModal}
        onClose={() => setShowModal(false)}
        entry={selectedEntry}
        type="sale"
        title="Sale Details"
      />
    </>
  );
}
