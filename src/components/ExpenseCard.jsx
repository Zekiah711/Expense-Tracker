// components/ExpenseCard.jsx
import currency from '../utils/currency';

export default function ExpenseCard({ item }) {
  return (
    <div className="mb-3 p-3 border rounded shadow-sm bg-white">
      <div className="d-flex justify-content-between">
        <div>
          <h6 className="mb-1">{item.name}</h6>
          <small className="text-muted">{item.supplier}</small>
        </div>
        <div className="text-end">
          <strong className="text-success">{currency.symbol}{(item.quantity * item.price).toFixed(2)}</strong><br />
          <small className="text-muted">{item.date}</small>
        </div>
      </div>
      {item.note && (
        <div className="mt-2">
          <small className="text-muted fst-italic">{item.note}</small>
        </div>
      )}
    </div>
  );
}
