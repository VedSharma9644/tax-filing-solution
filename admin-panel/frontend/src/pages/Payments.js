import React, { useState } from 'react';
import './Payments.css';

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const payments = [
    {
      id: 1,
      applicationId: '67d58581d98edd7b63e5ffac',
      name: 'Sreenivas Boddula',
      email: 'sreenivas.boddula@gmail.com',
      amount: '$114.03',
      currency: 'USD',
      paymentId: 'pi_3R9yNfG09mwQybGj0ctiHaig',
      date: 'Apr 4, 2025'
    },
    {
      id: 2,
      applicationId: '67eca358d98edd7b63e6119c',
      name: 'Sai Sathya Maganti',
      email: 'sathyamaganti08@gmail.com',
      amount: '$72.67',
      currency: 'USD',
      paymentId: 'pi_3R9HcKG09mwQybGj1dmCCp5F',
      date: 'Apr 2, 2025'
    },
    {
      id: 3,
      applicationId: '67e5d78cd98edd7b63e60f41',
      name: 'Sai Santhosh Reddy Nakireddy',
      email: 'santhosh.nakireddy6@gmail.com',
      amount: '$41.65',
      currency: 'USD',
      paymentId: 'pi_3R8baFG09mwQybGj1Du857Oh',
      date: 'Mar 31, 2025'
    },
    {
      id: 4,
      applicationId: '67cddf03d98edd7b63e5fb65',
      name: 'Sai Krishna Vilasagaram',
      email: 'saikrishna.vilasagaram@gmail.com',
      amount: '$72.67',
      currency: 'USD',
      paymentId: 'pi_3R4EMyG09mwQybGj1mzYKv7r',
      date: 'Mar 19, 2025'
    },
    {
      id: 5,
      applicationId: '67d9c11ed98edd7b63e60497',
      name: 'Gokul Nandan Tammineni',
      email: 'gokultammineni@gmail.com',
      amount: '$72.67',
      currency: 'USD',
      paymentId: 'pi_3R45TuG09mwQybGj09Ky0I39',
      date: 'Mar 19, 2025'
    },
    {
      id: 6,
      applicationId: '67d9c0f6d98edd7b63e60489',
      name: 'varun Ikkurthi',
      email: 'varun.tej1221@gmail.com',
      amount: '$41.65',
      currency: 'USD',
      paymentId: 'pi_3R45T3G09mwQybGj1I9nq1wi',
      date: 'Mar 19, 2025'
    },
    {
      id: 7,
      applicationId: '67aa414275aa68d5b091d2d6',
      name: 'Seshi Vanukuri',
      email: 'seshi.vanukuri@gmail.com',
      amount: '$114.03',
      currency: 'USD',
      paymentId: 'pi_3QzjWyG09mwQybGj0nEEZY73',
      date: 'Mar 7, 2025'
    },
    {
      id: 8,
      applicationId: '67c5ea8dd98edd7b63e5f4b4',
      name: 'Rajendar Korepu',
      email: 'Rajendar4444@gmail.com',
      amount: '$72.67',
      currency: 'USD',
      paymentId: 'pi_3Qz04VG09mwQybGj05hBX2AA',
      date: 'Mar 4, 2025'
    },
    {
      id: 9,
      applicationId: '67a0edb55e7fac8e9045f629',
      name: 'Sravya Alla',
      email: 'sravsal2103@gmail.com',
      amount: '$41.65',
      currency: 'USD',
      paymentId: 'pi_3Qw6qmG09mwQybGj1CdjFehT',
      date: 'Feb 25, 2025'
    },
    {
      id: 10,
      applicationId: '67ad65a475aa68d5b091d636',
      name: 'Vishnuvardhan Reddy Nagireddy',
      email: 'nagireddyvishnureddy1@gmail.com',
      amount: '$41.65',
      currency: 'USD',
      paymentId: 'pi_3QuEDtG09mwQybGj1ul4FDdG',
      date: 'Feb 19, 2025'
    }
  ];

  const filteredPayments = payments.filter(payment =>
    payment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.paymentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="homepage">
      <main className="dashboard-content">
        <div className="payments-container">
          <h1 className="payments-title">Payment History</h1>
          <p className="payments-description">View and manage your payment records.</p>
          
          <div className="payments-actions">
            <input
              type="text"
              placeholder="Search by name, email, application ID or payment ID"
              className="payments-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <table className="payments-table">
            <thead>
              <tr>
                <th>Sl.No</th>
                <th>Application ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Payment ID</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => (
                <tr key={payment.id}>
                  <td>{index + 1}</td>
                  <td>{payment.applicationId}</td>
                  <td>{payment.name}</td>
                  <td>{payment.email}</td>
                  <td>{payment.amount}</td>
                  <td>{payment.currency}</td>
                  <td>{payment.paymentId}</td>
                  <td>{payment.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="pagination-controls">
            <button 
              className="pagination-button" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </button>
            <span className="pagination-info">Page {currentPage} of 2</span>
            <button 
              className="pagination-button"
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payments; 