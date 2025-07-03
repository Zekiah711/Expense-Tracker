import React, { useState, useEffect } from 'react';
import '../styles/ExpenseForm.css';
import { ref, push } from 'firebase/database';
import { db, auth } from '../firebase/firebase';
import currency from '../utils/currency';
import { toast } from 'react-toastify';

export default function ExpenseForm({ recordType = 'Expense' }) {
  const [items, setItems] = useState([
    { name: '', quantity: '', price: '', note: '', partyName: '', partyLocation: '', partyPhone: '' }
  ]);

  const getToday = () => new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(getToday());
  const [loading, setLoading] = useState(false);

  const isSale = recordType === 'Sale';
  const label = isSale ? 'Customer' : 'Supplier';
  const storageKey = `${recordType.toLowerCase()}Parties`;
  const [partyOptions, setPartyOptions] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setPartyOptions(JSON.parse(stored));
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(partyOptions));
  }, [partyOptions, storageKey]);

  const addItem = () => {
    setItems([...items, { name: '', quantity: '', price: '', note: '', partyName: '', partyLocation: '', partyPhone: '' }]);
  };

  const deleteItem = (indexToDelete) => {
    setItems(items.filter((_, i) => i !== indexToDelete));
  };

  const handleChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    const missingFields = [];

    if (!date) missingFields.push('Date');

    items.forEach((item, index) => {
      if (!item.name) missingFields.push(`Item Name (Item ${index + 1})`);
      if (!item.quantity) missingFields.push(`Quantity (Item ${index + 1})`);
      if (!item.price) missingFields.push(`Price (Item ${index + 1})`);
      if (!item.partyName) missingFields.push(`${label} Name (Item ${index + 1})`);
    });

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error('You must be logged in to save records.');
      return;
    }

    try {
      setLoading(true);
      const dbRef = ref(db, isSale ? `sales/${user.uid}` : `expenses/${user.uid}`);

      const isoDate = new Date(date);
      isoDate.setUTCHours(0, 0, 0, 0);
      const formattedDate = isoDate.toISOString();

      const savePromises = items.map(item => {
        return push(dbRef, {
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          note: item.note || '',
          partyName: item.partyName,
          partyLocation: item.partyLocation,
          partyPhone: item.partyPhone,
          date: formattedDate,
          createdAt: new Date().toISOString(),
          userId: user.uid
        });
      });

      await Promise.all(savePromises);
      toast.success(`${items.length} ${recordType.toLowerCase()} item${items.length > 1 ? 's' : ''} saved successfully.`);

      setItems([{ name: '', quantity: '', price: '', note: '', partyName: '', partyLocation: '', partyPhone: '' }]);
      setDate(getToday());
    } catch (error) {
      console.error(`${recordType} Save Error:`, error);
      toast.error(`Failed to save ${recordType.toLowerCase()} items. Try again.`);
    } finally {
      setLoading(false);
    }
  };

  const overallTotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return sum + qty * price;
  }, 0).toFixed(2);

  return (
    <div className="container my-4">
      {items.map((item, index) => (
        <div key={index} className="card p-3 mb-4 shadow-sm position-relative">
          {items.length > 1 && (
            <button
              className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2"
              onClick={() => deleteItem(index)}
              aria-label="Delete item"
              title="Remove item"
            >
              <i className="bi bi-trash"></i>
            </button>
          )}

          <h5 className="text-primary mb-3 form-title">Item {index + 1}</h5>

          <div className="mb-3">
            <label className="form-label fw-semibold">Item Details</label>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Office supplies"
                  value={item.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                />
              </div>
              <div className="col-md-3 mb-2">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0"
                  value={item.quantity}
                  onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                />
              </div>
              <div className="col-md-3 mb-2 d-flex flex-column">
                <label className="form-label">Unit Price</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  value={item.price}
                  onChange={(e) => handleChange(index, 'price', e.target.value)}
                />
                <small className="text-muted">per item</small>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Note (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Pens and notebooks for team"
              value={item.note}
              onChange={(e) => handleChange(index, 'note', e.target.value)}
            />
            <div className="mt-2 text-end text-muted fw-semibold">
              Total: {currency.symbol}
              {Number((parseFloat(item.quantity || 0) * parseFloat(item.price || 0)).toFixed(2)).toLocaleString()}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">{label} Name</label>
            <select
              className="form-select"
              value={item.partyName}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '__add_new__') {
                  setActiveItemIndex(index);
                  setNewPartyName('');
                  setShowModal(true);
                } else {
                  handleChange(index, 'partyName', value);
                }
              }}
            >
              <option value="">Select {label.toLowerCase()} name</option>
              {partyOptions.map((option, i) => (
                <option key={i} value={option}>{option}</option>
              ))}
              <option value="__add_new__">+ Add New {label}</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">{label} Phone</label>
            <input
              type="text"
              className="form-control"
              placeholder={`Enter ${label.toLowerCase()} phone`}
              value={item.partyPhone}
              onChange={(e) => handleChange(index, 'partyPhone', e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">{label} Location</label>
            <input
              type="text"
              className="form-control"
              placeholder={`Enter ${label.toLowerCase()} location`}
              value={item.partyLocation}
              onChange={(e) => handleChange(index, 'partyLocation', e.target.value)}
            />
          </div>
        </div>
      ))}

      <div className="text-center mb-4 add-item-cont">
        <button className="btn btn-outline-primary add-item" onClick={addItem}>
          + Add Another Item
        </button>
      </div>

      <div className="mb-4">
        <label className="form-label fw-semibold">Date</label>
        <input
          type="date"
          className="form-control"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="rounded-4 text-white text-center p-4 mb-4 total-box">
        <p className="mb-1">Total Amount</p>
        <h2 className="fw-bold">
          {currency.symbol}
          {Number(overallTotal).toLocaleString()}
        </h2>
      </div>

      <div className="text-center">
        <button
          className="btn btn-primary w-100 py-2 fw-semibold save-record-btn"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Record'}
        </button>
      </div>

      {/* Add New Party Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New {label}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Enter new ${label.toLowerCase()} name`}
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const trimmed = newPartyName.trim();
                    if (trimmed && !partyOptions.includes(trimmed)) {
                      setPartyOptions(prev => [...prev, trimmed]);
                    }
                    if (activeItemIndex !== null) {
                      handleChange(activeItemIndex, 'partyName', trimmed);
                    }
                    setShowModal(false);
                  }}
                  disabled={!newPartyName.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
