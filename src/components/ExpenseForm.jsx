import React, { useState, useEffect } from 'react';
import '../styles/ExpenseForm.css';
import { ref, push } from 'firebase/database';
import { db, auth } from '../firebase/firebase';
import currency from '../utils/currency';
import { toast } from 'react-toastify';

export default function ExpenseForm({ recordType = 'Expense' }) {
  const [items, setItems] = useState([
    { name: '', quantity: '', price: '', note: '', partyName: '', partyLocation: '', partyPhone: '', partyEmail: '' }
  ]);

  const getToday = () => new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(getToday);
  const [loading, setLoading] = useState(false);

  const isSale = recordType === 'Sale';
  const label = isSale ? 'Customer' : 'Supplier';

  const storageKey = `${recordType.toLowerCase()}Parties`;
  const [partyOptions, setPartyOptions] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [newPartyData, setNewPartyData] = useState({ name: '', phone: '', location: '', email: '' });
  const [activeItemIndex, setActiveItemIndex] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const normalized = parsed.map(p =>
          typeof p === 'string' ? { name: p, phone: '', location: '', email: '' } : p
        );
        setPartyOptions(normalized);
      } catch {
        setPartyOptions([]);
      }
    }
  }, [storageKey]);

  const addItem = () => {
    setItems([...items, { name: '', quantity: '', price: '', note: '', partyName: '', partyLocation: '', partyPhone: '', partyEmail: '' }]);
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

      const savePromises = items.map(item =>
        push(dbRef, {
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          note: item.note || '',
          partyName: item.partyName,
          partyPhone: item.partyPhone,
          partyLocation: item.partyLocation,
          partyEmail: item.partyEmail,
          date,
          createdAt: new Date().toISOString(),
          userId: user.uid
        })
      );

      await Promise.all(savePromises);
      toast.success(`${items.length} ${recordType.toLowerCase()} item${items.length > 1 ? 's' : ''} saved successfully.`);

      setItems([{ name: '', quantity: '', price: '', note: '', partyName: '', partyLocation: '', partyPhone: '', partyEmail: '' }]);
      setDate(getToday());
    } catch (error) {
      console.error(`${recordType} Save Error:`, error);
      toast.error(`Failed to save ${recordType.toLowerCase()} items. Try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParty = (nameToDelete) => {
    const updated = partyOptions.filter(p => p.name !== nameToDelete);
    setPartyOptions(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    toast.success(`${label} deleted from list.`);
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
              <div className="col-md-3 mb-2">
                <label className="form-label">Unit Price</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  value={item.price}
                  onChange={(e) => handleChange(index, 'price', e.target.value)}
                />
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
                  setNewPartyData({ name: '', phone: '', location: '', email: '' });
                  setShowModal(true);
                } else {
                  const selected = partyOptions.find(p => p.name === value);
                  if (selected) {
                    handleChange(index, 'partyName', selected.name);
                    handleChange(index, 'partyPhone', selected.phone);
                    handleChange(index, 'partyLocation', selected.location);
                    handleChange(index, 'partyEmail', selected.email || '');
                  }
                }
              }}
            >
              <option value="">Select {label.toLowerCase()} name</option>
              {partyOptions.map((option, i) => (
                <option key={i} value={option.name}>{option.name}</option>
              ))}
              <option value="__add_new__">+ Add New {label}</option>
            </select>

            {partyOptions.length > 0 && (
              <div className="mt-2">
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => {
                    const last = item.partyName;
                    if (last) {
                      handleDeleteParty(last);
                    } else {
                      toast.warn(`Select a ${label.toLowerCase()} to delete.`);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            )}
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

      <div
        className="rounded-4 text-white text-center p-4 mb-4 total-box"
      >
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
                  className="form-control mb-2"
                  placeholder={`Name of ${label.toLowerCase()}`}
                  value={newPartyData.name}
                  onChange={(e) => setNewPartyData({ ...newPartyData, name: e.target.value })}
                />
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Phone number"
                  value={newPartyData.phone}
                  onChange={(e) => setNewPartyData({ ...newPartyData, phone: e.target.value })}
                />
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Location"
                  value={newPartyData.location}
                  onChange={(e) => setNewPartyData({ ...newPartyData, location: e.target.value })}
                />
                <input
                  type="email"
                  className="form-control mb-2"
                  placeholder="Email (optional)"
                  value={newPartyData.email}
                  onChange={(e) => setNewPartyData({ ...newPartyData, email: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const trimmedName = newPartyData.name.trim();
                    if (trimmedName && !partyOptions.some(p => p.name === trimmedName)) {
                      const newEntry = {
                        name: trimmedName,
                        phone: newPartyData.phone.trim(),
                        location: newPartyData.location.trim(),
                        email: newPartyData.email.trim()
                      };
                      const updatedList = [...partyOptions, newEntry];
                      setPartyOptions(updatedList);
                      localStorage.setItem(storageKey, JSON.stringify(updatedList));

                      if (activeItemIndex !== null) {
                        handleChange(activeItemIndex, 'partyName', newEntry.name);
                        handleChange(activeItemIndex, 'partyPhone', newEntry.phone);
                        handleChange(activeItemIndex, 'partyLocation', newEntry.location);
                        handleChange(activeItemIndex, 'partyEmail', newEntry.email);
                      }
                    }
                    setShowModal(false);
                  }}
                  disabled={!newPartyData.name.trim()}
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
