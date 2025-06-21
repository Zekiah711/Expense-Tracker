import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import DetailsModal from '../components/DetailsModal';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All Time');
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const userRef = ref(db, `expenses/${user.uid}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setExpenses([]);
        return;
      }

      // Add Firebase keys to each entry
      const allExpenses = Object.entries(data).map(([key, value]) => ({
        ...value,
        _id: key
      }));

      const today = new Date();

      const filtered = allExpenses.filter(entry => {
        const entryDate = new Date(entry.date);
        const isToday = entryDate.toDateString() === today.toDateString();
        const isThisWeek = (today - entryDate) <= 7 * 24 * 60 * 60 * 1000;
        const isThisMonth =
          entryDate.getMonth() === today.getMonth() &&
          entryDate.getFullYear() === today.getFullYear();

        const matchesDate =
          filter === 'All Time' ||
          (filter === 'Today' && isToday) ||
          (filter === 'This Week' && isThisWeek) ||
          (filter === 'This Month' && isThisMonth);

        const matchesSearch = entry.items.some(item =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.supplier.toLowerCase().includes(search.toLowerCase())
        );

        return matchesDate && matchesSearch;
      });

      setExpenses(filtered);
    });

    return () => unsubscribe();
  }, [filter, search]);

  const calculateTotalAmount = (expenseList) => {
    return expenseList.reduce((total, entry) => {
      const entryTotal = entry.items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        return sum + qty * price;
      }, 0);
      return total + entryTotal;
    }, 0).toFixed(2);
  };

  const totalAmount = calculateTotalAmount(expenses);

  const handleDeleteEntry = (firebaseId) => {
    if (!window.confirm("Delete this expense entry?")) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const entryRef = ref(db, `expenses/${user.uid}/${firebaseId}`);
    remove(entryRef);
  };

  const handleClearAll = () => {
    if (!window.confirm("Clear all expense entries? This cannot be undone.")) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const userRef = ref(db, `expenses/${user.uid}`);
    remove(userRef);
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

          {/* Total Summary */}
          <div
            className="rounded-4 text-white text-center p-4 mb-4"
            style={{
              background: 'linear-gradient(to right, rgb(230, 48, 48), rgb(245, 116, 116))',
              borderRadius: '1.5rem',
              boxShadow: '0 3px 10px rgba(140, 17, 17, 0.69)'
            }}
          >
            <p className="mb-1">Total Expenses</p>
            <h2 className="fw-bold">${totalAmount}</h2>
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
            </select>
            <input
              type="text"
              className="form-control"
              placeholder="Search by item or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Expense Entries */}
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0">Expense Entries</h6>
              <span className="badge bg-light text-dark">
                {expenses.length} {expenses.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>

            {expenses.length === 0 && <p className="text-muted">No expenses to show.</p>}

            {expenses.map((entry) => {
              const entryTotal = entry.items.reduce((sum, item) => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.price) || 0;
                return sum + qty * price;
              }, 0).toFixed(2);

              const firstItem = entry.items[0];

              return (
                <div key={entry._id} className="p-3 mb-3 bg-white rounded shadow-sm border">
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong className="mb-1 d-block">{firstItem?.name || 'Unnamed Item'}</strong>
                      <div className="text-muted small mb-2">
                        Supplier: {firstItem?.supplier || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-danger mb-1">${entryTotal}</div>
                      <div className="text-muted small">{new Date(entry.date).toDateString()}</div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleViewDetails(entry)}
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

            {expenses.length > 0 && (
              <button className="btn btn-danger w-100 mt-3" onClick={handleClearAll}>
                Clear All Expenses
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <DetailsModal
        show={showModal}
        onClose={() => setShowModal(false)}
        entry={selectedEntry}
      />
    </>
  );
}
