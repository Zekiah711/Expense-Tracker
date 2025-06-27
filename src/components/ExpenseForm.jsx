import React, { useState, useEffect } from 'react';
import '../styles/ExpenseForm.css';
import { ref, push } from 'firebase/database';
import { db, auth } from '../firebase/firebase';
import currency from '../utils/currency';
import { toast } from 'react-toastify';

export default function ExpenseForm({ recordType = 'Expense' }) {
    const [items, setItems] = useState([
          { name: '', quantity: '', price: '', note: '', supplier: '' }
        ]);
        const getToday = () => new Date().toISOString().slice(0, 10);
      const [date, setDate] = useState(getToday);

      // Auto-fill today's date if cleared manually
      useEffect(() => {
        if (!date) {
          setDate(getToday());
        }
      }, [date]);

  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplierInfo, setNewSupplierInfo] = useState({ name: '', location: '', contact: '' });
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  const isSale = recordType === 'Sale';
  const label = isSale ? 'Customer' : 'Supplier';

  // ✅ Sync suppliers/customers when recordType changes
  useEffect(() => {
    const localKey = isSale ? 'customers' : 'suppliers';
    const saved = localStorage.getItem(localKey);
    setSuppliers(saved ? JSON.parse(saved) : []);
  }, [recordType]);

  const addItem = () => {
    setItems([...items, { name: '', quantity: '', price: '', note: '', supplier: '' }]);
  };

  const deleteItem = (indexToDelete) => {
    setItems(items.filter((_, i) => i !== indexToDelete));
  };

  const handleChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSupplierChange = (index, value) => {
    if (value === 'custom') {
      setSelectedItemIndex(index);
      setShowSupplierModal(true);
    } else {
      handleChange(index, 'supplier', value);
    }
  };

  const handleSave = async () => {
    const missingFields = [];

    if (!date) missingFields.push('Date');

    items.forEach((item, index) => {
      if (!item.name) missingFields.push(`Item Name (Item ${index + 1})`);
      if (!item.quantity) missingFields.push(`Quantity (Item ${index + 1})`);
      if (!item.price) missingFields.push(`Price (Item ${index + 1})`);
      if (!item.supplier) missingFields.push(`${label} (Item ${index + 1})`);
    });

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to save records.");
      return;
    }

    try {
      setLoading(true);
      const dbRef = ref(db, isSale ? `sales/${user.uid}` : `expenses/${user.uid}`);

      const savePromises = items.map(item => {
        const fullSupplier = suppliers.find(s => s.name === item.supplier);
        return push(dbRef, {
          ...item,
          supplierInfo: fullSupplier || {},
          date,
          createdAt: new Date().toISOString(),
          userId: user.uid
        });
      });

      await Promise.all(savePromises);
      toast.success(`${items.length} ${recordType.toLowerCase()} item${items.length > 1 ? 's' : ''} saved successfully.`);
      setItems([{ name: '', quantity: '', price: '', note: '', supplier: '' }]);
      setDate('');
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
            <label className="form-label">{label}</label>
            <select
              className="form-select"
              value={item.supplier || ''}
              onChange={(e) => handleSupplierChange(index, e.target.value)}
            >
              <option value=""> Select or Add New </option>
              {suppliers.map((s, i) => (
                <option key={i} value={s.name}>{s.name}</option>
              ))}
              <option value="custom">+ Add new {label.toLowerCase()}</option>
            </select>
          </div>
        </div>
      ))}

      <div className="text-center mb-4 add-item-cont">
        <button className="btn btn-outline-primary add-item" onClick={addItem}>+ Add Another Item</button>
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
        <h2 className="fw-bold">{currency.symbol}{Number(overallTotal).toLocaleString()}</h2>
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

      {showSupplierModal && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4 rounded-3 shadow">
              <h5 className="modal-title mb-3">Add New {label}</h5>

              <div className="mb-2">
                <label className="form-label">Name</label>
                <input type="text" className="form-control"
                  value={newSupplierInfo.name}
                  onChange={(e) => setNewSupplierInfo({ ...newSupplierInfo, name: e.target.value })}
                />
              </div>
              <div className="mb-2">
                <label className="form-label">Location (optional)</label>
                <input type="text" className="form-control"
                  value={newSupplierInfo.location}
                  onChange={(e) => setNewSupplierInfo({ ...newSupplierInfo, location: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Contact (email/phone)</label>
                <input type="text" className="form-control"
                  value={newSupplierInfo.contact}
                  onChange={(e) => setNewSupplierInfo({ ...newSupplierInfo, contact: e.target.value })}
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-secondary" onClick={() => setShowSupplierModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => {
                  if (!newSupplierInfo.name.trim()) {
                    toast.error(`${label} name is required`);
                    return;
                  }

                  const updated = [...suppliers, newSupplierInfo];
                  const localKey = isSale ? 'customers' : 'suppliers';
                  setSuppliers(updated);
                  localStorage.setItem(localKey, JSON.stringify(updated));
                  handleChange(selectedItemIndex, 'supplier', newSupplierInfo.name);
                  setNewSupplierInfo({ name: '', location: '', contact: '' });
                  setShowSupplierModal(false);
                }}>
                  Add {label}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

