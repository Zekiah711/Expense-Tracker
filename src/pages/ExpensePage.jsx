import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import TopNav from '../components/TopNav';
import DetailsModal from '../components/DetailsModal';
import currency from '../utils/currency';
import { getDatabase, ref, get, remove } from 'firebase/database';
import { auth } from '../firebase/firebase';

const LOCAL_KEY = 'todays_expenses';

const getTodayExpensesFromLocal = () => {
  const data = localStorage.getItem(LOCAL_KEY);
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    const today = new Date().toDateString();
    if (parsed.date === today) {
      return parsed.expenses;
    }
  } catch {
    return null;
  }
  return null;
};

const saveTodayExpensesToLocal = (expenses) => {
  const today = new Date().toDateString();
  const payload = {
    date: today,
    expenses,
  };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
};

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    const loadExpenses = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const cached = getTodayExpensesFromLocal();
      if (filter === 'Today' && !search && cached) {
        setExpenses(cached);
        return;
      }

      const firebaseDB = getDatabase();
      const userRef = ref(firebaseDB, `expenses/${user.uid}`);
      const snapshot = await get(userRef);
      const data = snapshot.val();

      if (data) {
        const dataArray = Object.entries(data).map(([id, value]) => ({ ...value, id }));
        const today = new Date();

        const filtered = dataArray.filter(item => {
          const entryDate = new Date(item.date);
          const isToday = entryDate.toDateString() === today.toDateString();
          const isThisWeek = (today - entryDate) <= 7 * 24 * 60 * 60 * 1000;
          const isThisMonth =
            entryDate.getMonth() === today.getMonth() &&
            entryDate.getFullYear() === today.getFullYear();

          const matchesDate =
            filter === 'All Time' ||
            (filter === 'Today' && isToday) ||
            (filter === 'This Week' && isThisWeek) ||
            (filter === 'This Month' && isThisMonth) ||
            (filter === 'Custom Date Range' && customStart && customEnd &&
              entryDate >= new Date(customStart) && entryDate <= new Date(customEnd));

          const matchesSearch =
            item.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.supplier?.toLowerCase().includes(search.toLowerCase());

          return matchesDate && matchesSearch;
        });

        setExpenses(filtered);

        if (filter === 'Today' && !search) {
          saveTodayExpensesToLocal(filtered);
        }
      } else {
        setExpenses([]);
      }
    };

    loadExpenses();
  }, [filter, search, customStart, customEnd]);

  const totalAmount = expenses.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return sum + qty * price;
  }, 0).toFixed(2);

  const handleDeleteEntry = async (id) => {
    const toastId = toast.warning(
      <div>
        Are you sure you want to delete this expense?
        <div className="mt-2 d-flex justify-content-end gap-2">
          <button
            className="btn btn-sm btn-danger"
            onClick={async () => {
              toast.dismiss(toastId);
              const user = auth.currentUser;
              if (!user) return;
              const firebaseDB = getDatabase();
              const itemRef = ref(firebaseDB, `expenses/${user.uid}/${id}`);
              await remove(itemRef);
              const updated = expenses.filter(item => item.id !== id);
              setExpenses(updated);
              toast.success('Expense entry deleted successfully.');

              if (filter === 'Today' && !search) {
                saveTodayExpensesToLocal(updated);
              }
            }}
          >
            Yes, Delete
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => toast.dismiss(toastId)}>
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

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setShowModal(true);
  };

  return (
    <>
      <TopNav />
      <div className="container d-flex justify-content-center my-4">
        <div className="card shadow p-4" style={{ width: '100%', maxWidth: '600px' }}>
          <h3 className="fw-bold text-center mb-4">My Expenses</h3>

          {/* Summary */}
          <div
            className="rounded-4 text-white text-center p-4 mb-4"
            style={{
              background: 'linear-gradient(to right, rgb(230, 48, 48), rgb(245, 116, 116))',
              borderRadius: '1.5rem',
              boxShadow: '0 3px 10px rgba(140, 17, 17, 0.69)'
            }}
          >
            <p className="mb-1">Total Expenses</p>
            <h2 className="fw-bold">
              {currency.symbol}{Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <small className="text-white-70 fw-semibold">
              {filter === 'All Time' ? 'All Time' : filter}
            </small>
          </div>

          {/* Filter + Search */}
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
              <option>Custom Date Range</option>
            </select>

            {filter === 'Custom Date Range' && (
              <div className="mb-2 d-flex gap-2">
                <input
                  type="date"
                  className="form-control"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <input
                  type="date"
                  className="form-control"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            )}

            <input
              type="text"
              className="form-control"
              placeholder="Search by item or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Expense List */}
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0">Expense Entries</h6>
              <span className="badge bg-light text-dark">
                {expenses.length} {expenses.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>

            {expenses.length === 0 && <p className="text-muted">No expenses to show.</p>}

            {expenses.map((item) => {
              const total = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);

              return (
                <div key={item.id} className="p-3 mb-3 bg-white rounded shadow-sm border">
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong className="mb-1 d-block">{item.name || 'Unnamed Item'}</strong>
                      <div className="text-muted small mb-2">
                        Supplier: {item.supplier || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-danger mb-1">
                        {currency.symbol}{Number(total.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-muted small">{new Date(item.date).toDateString()}</div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewDetails(item)}>
                      Details
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteEntry(item.id)}>
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
      />
    </>
  );
}
