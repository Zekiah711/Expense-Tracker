import React, { useState, useEffect } from 'react';
import '../styles/ExpenseForm.css';

export default function ExpenseForm({ recordType = 'Expense' }) {
  const [items, setItems] = useState([
    { name: '', quantity: '', price: '', note: '', supplier: '' }
  ]);
  const [date, setDate] = useState('');
  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('suppliers');
    return saved ? JSON.parse(saved) : ["ABC Corp", "Global Supplies", "Stationery Inc"];
  });
  const [loading, setLoading] = useState(false);

  const isSale = recordType === 'Sale';
  const label = isSale ? 'Customer' : 'Supplier';
  const localStorageKey = isSale ? 'sales' : 'expenses';

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

  const calculateTotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return (qty * price).toFixed(2);
  };

  const overallTotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return sum + qty * price;
  }, 0).toFixed(2);

  const handleSave = () => {
    const isValid = date && items.every(item => item.name && item.quantity && item.price);
    if (!isValid) {
      alert("Please fill in all required fields before saving.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const prev = JSON.parse(localStorage.getItem(localStorageKey)) || [];
      const newEntry = { date, items };
      const updated = [newEntry, ...prev];
      localStorage.setItem(localStorageKey, JSON.stringify(updated));

      setLoading(false);
      alert("Record saved!");
      setItems([{ name: '', quantity: '', price: '', note: '', supplier: '' }]);
      setDate('');
    }, 1000);
  };

  const handleSupplierChange = (index, value) => {
    if (value === 'custom') {
      const newSupplier = prompt(`Enter new ${label.toLowerCase()} name:`);
      if (newSupplier) {
        const updatedSuppliers = [...suppliers, newSupplier];
        setSuppliers(updatedSuppliers);
        localStorage.setItem('suppliers', JSON.stringify(updatedSuppliers));
        handleChange(index, 'supplier', newSupplier);
      }
    } else {
      handleChange(index, 'supplier', value);
    }
  };

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
          </div>

          <div className="mb-3">
            <label className="form-label">{label}</label>
            <select
              className="form-select"
              value={item.supplier || ''}
              onChange={(e) => handleSupplierChange(index, e.target.value)}
            >
              <option value="">{`Select ${label.toLowerCase()}`}</option>
              {suppliers.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
              <option value="custom">+ Add new {label.toLowerCase()}</option>
            </select>
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
        <h2 className="fw-bold">${overallTotal}</h2>
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
    </div>
  );
}
