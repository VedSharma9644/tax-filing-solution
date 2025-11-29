import React from 'react';
import './MilestoneProgressBar.css';

const MilestoneProgressBar = ({ currentStep, totalSteps, onStepPress, steps }) => {
  const getStepStatus = (stepNumber) => {
    if (stepNumber < currentStep) {
      return 'completed';
    } else if (stepNumber === currentStep) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  const getStepIcon = (stepNumber, icon) => {
    const status = getStepStatus(stepNumber);
    
    switch (status) {
      case 'completed':
        return (
          <div className="milestone-icon-container milestone-icon-completed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        );
      case 'current':
        return (
          <div className="milestone-icon-container milestone-icon-current">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {icon === 'document-text' && (
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </>
              )}
              {icon === 'cash' && (
                <>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="6" x2="12" y2="18"/>
                  <path d="M9 9h6M9 15h6"/>
                </>
              )}
              {icon === 'receipt' && (
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </>
              )}
              {icon === 'person' && (
                <>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </>
              )}
              {icon === 'checkmark-circle' && (
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </>
              )}
            </svg>
          </div>
        );
      case 'pending':
        return (
          <div className="milestone-icon-container milestone-icon-pending">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getConnectorColor = (stepNumber) => {
    if (stepNumber < currentStep) {
      return '#10B981'; // Green for completed
    } else {
      return '#6B7280'; // Gray for pending
    }
  };

  return (
    <div className="milestone-progress-bar-container">
      <div className="milestone-progress-bar">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <button
              className="milestone-step-container"
              onClick={() => onStepPress(step.id)}
              disabled={step.id > currentStep}
            >
              {getStepIcon(step.id, step.icon)}
            </button>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className="milestone-connector"
                style={{ backgroundColor: getConnectorColor(step.id) }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Labels Row */}
      <div className="milestone-labels-container">
        {steps.map((step) => (
          <div key={`label-${step.id}`} className="milestone-label-container">
            <span className={`milestone-step-text ${getStepStatus(step.id) === 'current' ? 'milestone-current-step-text' : ''}`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MilestoneProgressBar;

