import React from 'react';

export default function DetailsModal({ show, onClose, entry, title = "Details", type = "expense" }) {
  if (!show || !entry) return null;

  const label = type === 'sale' ? 'Customer' : 'Supplier';

  return (
    <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-sm rounded-4">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {entry.items.map((item, idx) => {
              const qty = parseFloat(item.quantity) || 0;
              const price = parseFloat(item.price) || 0;
              const total = (qty * price).toFixed(2);

              return (
                <div key={idx} className="mb-4">
                  <p><strong>Item Name:</strong> {item.name}</p>
                  <p><strong>Quantity:</strong> {item.quantity}</p>
                  <p><strong>Unit Price:</strong> N{price}</p>
                  <p><strong>Total Amount:</strong> <span className="text-success">${total}</span></p>
                  <p><strong>Date:</strong> {new Date(entry.date).toDateString()}</p>
                  <p><strong>{label} Name:</strong> {item.supplier}</p>
                  {item.note && <p><strong>Note:</strong> {item.note}</p>}
                  {idx !== entry.items.length - 1 && <hr />}
                </div>
              );
            })}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
