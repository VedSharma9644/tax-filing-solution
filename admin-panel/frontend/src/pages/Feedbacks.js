import React, { useState } from 'react';
import './Feedbacks.css';

const Feedbacks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      user: 'Sreenivas Boddula',
      email: 'sreenivas.boddula@gmail.com',
      feedback: 'Great service! The tax filing process was smooth and professional. The team was very helpful throughout the entire process.',
      reply: 'Thank you for your positive feedback! We\'re glad we could help make your tax filing experience smooth.',
      date: 'Apr 4, 2025',
      status: 'Replied'
    },
    {
      id: 2,
      user: 'Sai Sathya Maganti',
      email: 'sathyamaganti08@gmail.com',
      feedback: 'The mobile app is very user-friendly. However, I would like to see more payment options in the future.',
      reply: 'Thank you for your feedback! We\'re working on adding more payment options to improve user experience.',
      date: 'Apr 2, 2025',
      status: 'Replied'
    },
    {
      id: 3,
      user: 'Sai Santhosh Reddy Nakireddy',
      email: 'santhosh.nakireddy6@gmail.com',
      feedback: 'The customer support team was excellent. They helped me resolve my issue quickly and professionally.',
      reply: 'We\'re happy to hear that our support team was able to help you effectively. Thank you for choosing our service!',
      date: 'Mar 31, 2025',
      status: 'Replied'
    },
    {
      id: 4,
      user: 'Sai Krishna Vilasagaram',
      email: 'saikrishna.vilasagaram@gmail.com',
      feedback: 'The tax calculation was accurate and the refund was processed faster than expected. Highly recommended!',
      reply: 'Thank you for your recommendation! We strive to provide accurate calculations and fast processing.',
      date: 'Mar 19, 2025',
      status: 'Replied'
    },
    {
      id: 5,
      user: 'Gokul Nandan Tammineni',
      email: 'gokultammineni@gmail.com',
      feedback: 'The interface could be more intuitive. Some features are hard to find.',
      reply: 'Thank you for your feedback. We\'re continuously working on improving the user interface.',
      date: 'Mar 19, 2025',
      status: 'Pending'
    },
    {
      id: 6,
      user: 'varun Ikkurthi',
      email: 'varun.tej1221@gmail.com',
      feedback: 'Excellent service! The team was knowledgeable and helped me save money on my taxes.',
      reply: 'We\'re glad we could help you save money! Thank you for your positive feedback.',
      date: 'Mar 19, 2025',
      status: 'Replied'
    },
    {
      id: 7,
      user: 'Seshi Vanukuri',
      email: 'seshi.vanukuri@gmail.com',
      feedback: 'The mobile app needs better offline functionality. Sometimes it doesn\'t work without internet.',
      reply: 'We\'re working on improving offline functionality. Thank you for bringing this to our attention.',
      date: 'Mar 7, 2025',
      status: 'Replied'
    },
    {
      id: 8,
      user: 'Rajendar Korepu',
      email: 'Rajendar4444@gmail.com',
      feedback: 'Very professional service. The tax filing was completed without any issues.',
      reply: 'Thank you for your feedback! We\'re committed to providing professional and reliable service.',
      date: 'Mar 4, 2025',
      status: 'Replied'
    }
  ]);

  const [replyText, setReplyText] = useState({});

  const handleReplyChange = (feedbackId, text) => {
    setReplyText({
      ...replyText,
      [feedbackId]: text
    });
  };

  const handleSendReply = (feedbackId) => {
    setFeedbacks(feedbacks.map(feedback => 
      feedback.id === feedbackId 
        ? { 
            ...feedback, 
            reply: replyText[feedbackId] || feedback.reply,
            status: 'Replied'
          }
        : feedback
    ));
    setReplyText({
      ...replyText,
      [feedbackId]: ''
    });
  };

  const filteredFeedbacks = feedbacks.filter(feedback =>
    feedback.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.feedback.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="homepage">
      <main className="dashboard-content">
        <div className="feedbacks-container">
          <h1 className="feedbacks-title">User Feedbacks</h1>
          
          <input
            type="text"
            placeholder="Search by user name, email or feedback content..."
            className="feedbacks-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {filteredFeedbacks.length === 0 ? (
            <p className="no-feedback-msg">No feedbacks found.</p>
          ) : (
            <div className="feedbacks-list">
              {filteredFeedbacks.map((feedback) => (
                <div key={feedback.id} className="feedback-card">
                  <div className="feedback-header">
                    <div className="feedback-user-info">
                      <h3 className="feedback-user-name">{feedback.user}</h3>
                      <p className="feedback-email">{feedback.email}</p>
                      <span className="feedback-date">{feedback.date}</span>
                    </div>
                    <div className="feedback-status">
                      <span className={`status-badge ${feedback.status.toLowerCase()}`}>
                        {feedback.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="feedback-content">
                    <h4 className="feedback-label">Feedback:</h4>
                    <p className="feedback-text">{feedback.feedback}</p>
                  </div>
                  
                  <div className="feedback-reply">
                    <h4 className="feedback-label">Reply:</h4>
                    {feedback.status === 'Replied' ? (
                      <p className="reply-text">{feedback.reply}</p>
                    ) : (
                      <div className="reply-input-section">
                        <textarea
                          className="reply-textarea"
                          placeholder="Type your reply here..."
                          value={replyText[feedback.id] || ''}
                          onChange={(e) => handleReplyChange(feedback.id, e.target.value)}
                        />
                        <button
                          className="send-reply-button"
                          onClick={() => handleSendReply(feedback.id)}
                          disabled={!replyText[feedback.id] || replyText[feedback.id].trim() === ''}
                        >
                          Send Reply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {filteredFeedbacks.length > 0 && (
            <div className="pagination-controls">
              <button 
                className="pagination-button" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span className="pagination-info">Page {currentPage} of 1</span>
              <button 
                className="pagination-button"
                disabled
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Feedbacks; 