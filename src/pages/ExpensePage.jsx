import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import TopNav from '../components/TopNav';
import DetailsModal from '../components/DetailsModal';
import currency from '../utils/currency';
import { getDatabase, ref, remove, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const LOCAL_KEY = 'todays_expenses';

const getTodayDateString = () =>
  new Date().toLocaleDateString('en-CA'); // Local YYYY-MM-DD

const getTodayExpensesFromLocal = () => {
  const data = localStorage.getItem(LOCAL_KEY);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    if (parsed.date === getTodayDateString()) {
      return parsed.expenses;
    }
  } catch {
    return null;
  }

  return null;
};

const saveTodayExpensesToLocal = (expenses) => {
  const payload = {
    date: getTodayDateString(),
    expenses,
  };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
};

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Today');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const formatAmount = (amount) =>
    Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 });

  useEffect(() => {
    const loadExpenses = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getDatabase();
      const userRef = ref(db, `expenses/${user.uid}`);

      let useCache = false;
      let cached = [];

      if (filter === 'Today' && !search) {
        const local = getTodayExpensesFromLocal();
        if (local) {
          cached = local;
          useCache = true;
        }
      }

      try {
        const snapshot = await get(userRef);
        const data = snapshot.val();

        if (!data && useCache) {
          setExpenses(cached);
          return;
        }

        if (!data) {
          setExpenses([]);
          return;
        }

        const allExpenses = Object.entries(data).map(([key, value]) => ({
          ...value,
          id: key,
        }));

        const todayStr = getTodayDateString();
        const startDateStr = customRange.start;
        const endDateStr = customRange.end;

        const filtered = allExpenses.filter((entry) => {
          const entryDateStr = new Date(entry.date).toLocaleDateString('en-CA');

          const isToday = entryDateStr === todayStr;
          const isThisWeek =
            (new Date() - new Date(entry.date)) <= 7 * 24 * 60 * 60 * 1000;
          const isThisMonth =
            todayStr.slice(0, 7) === entryDateStr.slice(0, 7);
          const isCustomRange =
            filter === 'Custom Range' &&
            startDateStr &&
            endDateStr &&
            entryDateStr >= startDateStr &&
            entryDateStr <= endDateStr;

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

        setExpenses(filtered);

        if (filter === 'Today' && !search) {
          saveTodayExpensesToLocal(filtered);
        }
      } catch (err) {
        console.error('Error loading expenses:', err);
        if (useCache) {
          setExpenses(cached);
        }
      }
    };

    loadExpenses();
  }, [filter, search, customRange]);

  const totalAmount = expenses
    .reduce((total, entry) => {
      const qty = parseFloat(entry.quantity) || 0;
      const price = parseFloat(entry.price) || 0;
      return total + qty * price;
    }, 0)
    .toFixed(2);

  const handleDeleteEntry = async (id) => {
    const toastId = toast.warning(
      <div>
        Are you sure you want to delete this expense?
        <div className="mt-2 d-flex justify-content-end gap-2">
          <button
            className="btn btn-sm btn-danger"
            onClick={async () => {
              toast.dismiss(toastId);
              try {
                const user = getAuth().currentUser;
                if (!user) return;

                const itemRef = ref(getDatabase(), `expenses/${user.uid}/${id}`);
                await remove(itemRef);

                const updated = expenses.filter((item) => item.id !== id);
                setExpenses(updated);
                toast.success('Expense entry deleted successfully.');

                if (filter === 'Today' && !search) {
                  saveTodayExpensesToLocal(updated);
                }
              } catch (err) {
                toast.error('Failed to delete the expense. Please try again.');
                console.error('Delete Expense Error:', err);
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
        <div
          className="card shadow p-4"
          style={{ width: '100%', maxWidth: '600px' }}
        >
          <h3 className="fw-bold text-center mb-4">My Expenses</h3>

          <div
            className="rounded-4 text-white text-center p-4 mb-4"
            style={{
              background:
                'linear-gradient(to right, rgb(230, 48, 48), rgb(245, 116, 116))',
              borderRadius: '1.5rem',
              boxShadow: '0 3px 10px rgba(140, 17, 17, 0.69)',
            }}
          >
            <p className="mb-1">Total Expenses</p>
            <h2 className="fw-bold">
              {currency.symbol}
              {formatAmount(totalAmount)}
            </h2>
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
                  onChange={(e) =>
                    setCustomRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                />
                <input
                  type="date"
                  className="form-control"
                  value={customRange.end}
                  onChange={(e) =>
                    setCustomRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                />
              </div>
            )}

            <input
              type="text"
              className="form-control mb-2"
              placeholder="Search by item or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0">Expense Entries</h6>
              <span className="badge bg-light text-dark">
                {expenses.length} {expenses.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>

            {expenses.length === 0 && (
              <p className="text-muted">No expenses to show.</p>
            )}

            {expenses.map((entry) => {
              const qty = parseFloat(entry.quantity) || 0;
              const price = parseFloat(entry.price) || 0;
              const total = qty * price;

              return (
                <div
                  key={entry.id}
                  className="p-3 mb-3 bg-white rounded shadow-sm border"
                >
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong className="mb-1 d-block">
                        {entry.name || 'Unnamed Item'}
                      </strong>
                      <div className="text-muted small mb-2">
                        {entry.supplier || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-danger mb-1">
                        {currency.symbol}
                        {formatAmount(total)}
                      </div>
                      <div className="text-muted small">
                        {entry.date
                          ? new Date(entry.date).toDateString()
                          : 'No Date'}
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
                      onClick={() => handleDeleteEntry(entry.id)}
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
        type="expense"
        title="Expense Details"
      />
    </>
  );
}
