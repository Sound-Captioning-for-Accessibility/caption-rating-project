import React, { useState } from 'react';
import RGTProgressBar from './RGTProgressBar';

const RGTCatchAll = ({ existingConstructs, onAddConstruct, onComplete }) => {
  const [subStep, setSubStep] = useState('intro');
  const [additionalConstructs, setAdditionalConstructs] = useState([
    { poleOne: '', poleTwo: '' },
    { poleOne: '', poleTwo: '' },
  ]);

  const handleSkip = () => {
    onComplete();
  };

  const handleShowAdd = () => {
    setSubStep('add');
  };

  const handleConstructChange = (index, field, value) => {
    const updated = [...additionalConstructs];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalConstructs(updated);
  };

  const handleSubmit = async () => {
    for (const construct of additionalConstructs) {
      if (construct.poleOne.trim() && construct.poleTwo.trim()) {
        await onAddConstruct(construct.poleOne.trim(), construct.poleTwo.trim());
      }
    }
    onComplete();
  };

  const hasAnyFilled = additionalConstructs.some(
    c => c.poleOne.trim() && c.poleTwo.trim()
  );

  if (subStep === 'intro') {
    return (
      <div className="rgt-page">
        <RGTProgressBar currentStep="review" />
        <div className="rgt-content">
          <h1 className="rgt-title">Additional Constructs</h1>
          <div className="rgt-text-block">
            <p>
              In the previous section, you identified words and phrases that describe
              important differences in the non-speech information (NSI) captions
              across the videos.
            </p>
            <p>
              In this next step, you will have the opportunity to tell us whether there
              are any other constructs you thought of while watching the videos. This
              step is completely optional.
            </p>
          </div>
          <button className="rgt-btn rgt-btn-primary" onClick={() => setSubStep('review')}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (subStep === 'review') {
    return (
      <div className="rgt-page">
        <RGTProgressBar currentStep="review" />
        <div className="rgt-content">
          <h1 className="rgt-title">Review Your Constructs</h1>
          <p className="rgt-subtitle">Here are the constructs you have already identified:</p>

          <div className="rgt-constructs-list">
            {existingConstructs.map((construct, index) => (
              <div key={index} className="rgt-construct-item">
                <span className="rgt-construct-number">Construct {index + 1}</span>
                <span className="rgt-construct-poles">
                  {construct.alikePhrase} — {construct.contrastPhrase}
                </span>
              </div>
            ))}
          </div>

          <p className="rgt-note">
            Note: Only add a new construct in the next step if it feels meaningfully different from the ones listed here.
          </p>

          <div className="rgt-actions-row">
            <button className="rgt-btn rgt-btn-secondary" onClick={handleSkip}>
              Skip to Next Step
            </button>
            <button className="rgt-btn rgt-btn-primary" onClick={handleShowAdd}>
              Add additional constructs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add additional constructs
  return (
    <div className="rgt-page">
      <RGTProgressBar currentStep="review" />
      <div className="rgt-content">
        <h2 className="rgt-section-title">Add additional constructs</h2>
        <p className="rgt-instructions">
          Please describe any additional constructs you thought of while watching the videos.
          This step is completely optional.
        </p>

        {additionalConstructs.map((construct, index) => (
          <div key={index} className="rgt-additional-construct-form">
            <h3 className="rgt-construct-form-title">Additional Construct {index + 1}</h3>
            <div className="rgt-form-group">
              <label className="rgt-form-label">
                What word or short phrase describes one end of this construct?
              </label>
              <input
                type="text"
                className="rgt-input-text"
                placeholder="Enter a word or short phrase..."
                value={construct.poleOne}
                onChange={(e) => handleConstructChange(index, 'poleOne', e.target.value)}
              />
            </div>
            <div className="rgt-form-group">
              <label className="rgt-form-label">
                What word or short phrase describes the opposite end?
              </label>
              <input
                type="text"
                className="rgt-input-text"
                placeholder="Enter a word or short phrase..."
                value={construct.poleTwo}
                onChange={(e) => handleConstructChange(index, 'poleTwo', e.target.value)}
              />
            </div>
          </div>
        ))}

        <p className="rgt-note">
          Note: Please focus your responses on the non-speech information (NSI) captions.
        </p>

        <button
          className="rgt-btn rgt-btn-primary"
          onClick={handleSubmit}
          disabled={!hasAnyFilled}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default RGTCatchAll;
