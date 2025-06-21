import { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import RecordTypeToggle from '../components/RecordTypeToggle';
import ExpenseForm from '../components/ExpenseForm';

export default function MainDashboard() {
  const [recordType, setRecordType] = useState(localStorage.getItem('recordType') || 'Expense');

  useEffect(() => {
    localStorage.setItem('recordType', recordType);
  }, [recordType]);

  return (
    <>
      <TopNav />
      <div className="container d-flex justify-content-center my-4">
        <div className="card shadow p-4" style={{ width: '100%', maxWidth: '600px' }}>
          <RecordTypeToggle type={recordType} setType={setRecordType} />
          <ExpenseForm recordType={recordType} />
        </div>
      </div>
    </>
  );
}
