import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import DetailsModal from '../components/DetailsModal';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All Time');

  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    setUserId(user.uid);

    const db = getDatabase();
    const userSalesRef = ref(db, `sales/${user.uid}`);

    const unsubscribe = onValue(userSalesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setSales([]);
        return;
      }

      const allSales = Object.entries(data).map(([key, value]) => ({
        id: key,
        ...value
      }));

      const today = new Date();

      const filtered = allSales.filter(entry => {
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
          item.supplier?.toLowerCase().includes(search.toLowerCase())
        );

        return matchesDate && matchesSearch;
      });

      setSales(filtered);
    });

    return () => unsubscribe();
  }, [filter, search]);

  const calculateTotalAmount = (salesList) => {
    return salesList.reduce((total, entry) => {
      const entryTotal = entry.items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        return sum + qty * price;
      }, 0);
      return total + entryTotal;
    }, 0).toFixed(2);
  };

  const totalAmount = calculateTotalAmount(sales);

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Delete this sale entry?")) return;

    try {
      const db = getDatabase();
      await remove(ref(db, `sales/${userId}/${entryId}`));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all sale entries? This cannot be undone.")) return;
    try {
      const db = getDatabase();
      await remove(ref(db, `sales/${userId}`));
    } catch (err) {
      console.error("Clear all error:", err);
    }
  };

  return (
    <>
      <TopNav />
      <div className="container d-flex justify-content-center my-4">
        <div className="card shadow p-4" style={{ width: '100%', maxWidth: '600px' }}>
          <h3 className="fw-bold text-center mb-4">My Sales</h3>

          {/* Summary */}
          <div
            className="rounded-4 text-white text-center p-4 mb-4"
            style={{
              background: 'linear-gradient(to right, rgb(25, 135, 84), rgb(60, 205, 120))',
              borderRadius: '1.5rem',
              boxShadow: '0 3px 10px rgba(31, 182, 112, 0.5)'
            }}
          >
            <p className="mb-1">Total Sales</p>
            <h2 className="fw-bold">N
              {totalAmount}</h2>
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
              className="form-control mb-2"
              placeholder="Search by item or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sale Entries */}
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0">Sale Entries</h6>
              <span className="badge bg-light text-dark">
                {sales.length} {sales.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>

            {sales.length === 0 && <p className="text-muted">No sales to show.</p>}

            {sales.map((entry, i) => {
              const entryTotal = entry.items.reduce((sum, item) => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.price) || 0;
                return sum + qty * price;
              }, 0).toFixed(2);

              const firstItem = entry.items[0];

              return (
                <div key={entry.id} className="p-3 mb-3 bg-white rounded shadow-sm border">
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong className="mb-1 d-block">{firstItem?.name || 'Unnamed Item'}</strong>
                      <div className="text-muted small mb-2">
                        Customer: {firstItem?.supplier || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-success mb-1">N
                        {entryTotal}</div>
                      <div className="text-muted small">{new Date(entry.date).toDateString()}</div>
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

            {sales.length > 0 && (
              <button className="btn btn-danger w-100 mt-3" onClick={handleClearAll}>
                Clear All Sales
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
        type="sale"
        title="Sale Details"
      />
    </>
  );
}
