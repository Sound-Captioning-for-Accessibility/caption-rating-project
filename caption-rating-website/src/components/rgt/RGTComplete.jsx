import React from 'react';
import RGTProgressBar from './RGTProgressBar';

const RGTComplete = () => {
  return (
    <div className="rgt-page">
      <RGTProgressBar currentStep="done" />
      <div className="rgt-content rgt-content-center">
        <h1 className="rgt-title">Thank You!</h1>
        <div className="rgt-text-block">
          <p>
            You have now completed this study. Thank you for taking the time to
            participate. We appreciate your responses and look forward to
            reviewing them.
          </p>
        </div>
        <button
          className="rgt-btn rgt-btn-primary"
          onClick={() => window.location.href = '/home'}
        >
          Finish
        </button>
      </div>
    </div>
  );
};

export default RGTComplete;
