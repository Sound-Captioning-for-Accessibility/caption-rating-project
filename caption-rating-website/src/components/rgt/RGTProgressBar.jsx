import React from 'react';

const STEPS = [
  { key: 'rating', label: 'Rating' },
  { key: 'rounds', label: 'Rounds' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

const RGTProgressBar = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="rgt-progress-bar">
      <div className="rgt-progress-steps">
        {STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <div
              key={step.key}
              className={`rgt-progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <span className="rgt-progress-label">{step.label}</span>
              {!isLast && (
                <svg className="rgt-progress-chevron" width="20" height="40" viewBox="0 0 20 40" preserveAspectRatio="none">
                  <path d="M0 0 L15 20 L0 40" fill="none" stroke="#d1d5db" strokeWidth="1.5" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RGTProgressBar;
