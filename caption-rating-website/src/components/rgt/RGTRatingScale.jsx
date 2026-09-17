import React from 'react';

const RGTRatingScale = ({ min = 1, max = 5, value, onChange, leftLabel, rightLabel }) => {
  const points = [];
  for (let i = min; i <= max; i++) {
    points.push(i);
  }

  return (
    <div className="rgt-rating-scale">
      <div className="rgt-rating-labels">
        <span className="rgt-rating-label-left">{leftLabel}</span>
        <span className="rgt-rating-label-right">{rightLabel}</span>
      </div>
      <div className="rgt-rating-points">
        {points.map((point) => (
          <button
            key={point}
            type="button"
            className={`rgt-rating-point ${value === point ? 'selected' : ''}`}
            onClick={() => onChange(point)}
          >
            {point}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RGTRatingScale;
