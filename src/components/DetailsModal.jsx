import React from 'react';
import currency from '../utils/currency';

export default function DetailsModal({ show, onClose, entry, title = "Details", type = "expense" }) {
  if (!show || !entry) return null;

  const label = type === 'sale' ? 'Customer' : 'Supplier';
  const qty = parseFloat(entry.quantity) || 0;
  const price = parseFloat(entry.price) || 0;
  const total = (qty * price).toFixed(2);

  const info = entry.supplierInfo || {};

  return (
    <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-sm rounded-4">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p><strong>Item Name:</strong> {entry.name}</p>
            <p><strong>Quantity:</strong> {entry.quantity}</p>
            <p><strong>Unit Price:</strong> {currency.symbol}{price}</p>
            <p><strong>Total Amount:</strong> <span className="text-success">{currency.symbol}{total}</span></p>
            <p><strong>Date:</strong> {new Date(entry.date).toDateString()}</p>

            <p><strong>{label} Name:</strong> {info.name || entry.supplier}</p>
            {info.location && <p><strong>{label} Location:</strong> {info.location}</p>}
            {info.contact && <p><strong>{label} Contact:</strong> {info.contact}</p>}
            
            {entry.note && <p><strong>Note:</strong> {entry.note}</p>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
