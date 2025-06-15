import '../styles/RecordTypeToggle.css';

export default function RecordTypeToggle({ type, setType }) {
  return (
    <div className="record-toggle">
      <h4 className="fw-bold text-center mb-4">Record Expense or Sale</h4>
      <div className="toggle-buttons">
        <button
          className={`toggle-btn expense ${type === 'Expense' ? 'active' : ''}`}
          onClick={() => setType('Expense')}
        >
          Expense
        </button>
        <button
          className={`toggle-btn sale ${type === 'Sale' ? 'active' : ''}`}
          onClick={() => setType('Sale')}
        >
          Sale
        </button>
      </div>
    </div>
  );
}
