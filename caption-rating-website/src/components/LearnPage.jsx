import React, { useState } from 'react';
import './LearnPage.css';

const LearnPage = () => {
  const [expandedCards, setExpandedCards] = useState({});
  const dimensions = [
    {
      title: "Readability",
      description: "Ensuring captions are easy to read with proper font size, contrast, and positioning.",
      ratingExamples: [
        { rating: 1.0, stars: "★☆☆☆☆", example: "Example" },
        { rating: 2.0, stars: "★★☆☆☆", example: "Example" },
        { rating: 3.0, stars: "★★★☆☆", example: "Example" },
        { rating: 4.0, stars: "★★★★☆", example: "Example" },
        { rating: 5.0, stars: "★★★★★", example: "Example" }
      ]
    },
    {
      title: "Accuracy",
      description: "Captions should precisely match the spoken content and include important audio cues.",
      ratingExamples: [
        { rating: 1.0, stars: "★☆☆☆☆", example: "Example" },
        { rating: 2.0, stars: "★★☆☆☆", example: "Example" },
        { rating: 3.0, stars: "★★★☆☆", example: "Example" },
        { rating: 4.0, stars: "★★★★☆", example: "Example" },
        { rating: 5.0, stars: "★★★★★", example: "Example" }
      ]
    },
    {
      title: "Timing",
      description: "Captions should appear and disappear at the right moments to match the audio.",
      ratingExamples: [
        { rating: 1.0, stars: "★☆☆☆☆", example: "Example" },
        { rating: 2.0, stars: "★★☆☆☆", example: "Example" },
        { rating: 3.0, stars: "★★★☆☆", example: "Example" },
        { rating: 4.0, stars: "★★★★☆", example: "Example" },
        { rating: 5.0, stars: "★★★★★", example: "Example" }
      ]
    },
    {
      title: "Completeness",
      description: "All spoken content, including dialogue, narration, and important sounds, should be captioned.",
      ratingExamples: [
        { rating: 1.0, stars: "★☆☆☆☆", example: "Example" },
        { rating: 2.0, stars: "★★☆☆☆", example: "Example" },
        { rating: 3.0, stars: "★★★☆☆", example: "Example" },
        { rating: 4.0, stars: "★★★★☆", example: "Example" },
        { rating: 5.0, stars: "★★★★★", example: "Example" }
      ]
    }
  ];

  const toggleExpanded = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="learn-page">
      <div className="learn-header">
        <h1 className="learn-title">Captioning Dimensions Guide</h1>
        <p className="learn-subtitle">Learn about the essential elements that make captions effective and accessible</p>
      </div>

      <div className="dimensions-container">
        {dimensions.map((dimension, index) => (
          <div key={index} className="dimension-card">
            <h2 className="dimension-title">{dimension.title}</h2>
            <p className="dimension-description">{dimension.description}</p>
            
            <div className="examples-container">
              <div className="example-section">
                <h3 className="example-title">Bad Example</h3>
                <div className="example-image">
                  Image
                </div>
              </div>
              
              <div className="example-section">
                <h3 className="example-title">Good Example</h3>
                <div className="example-image">
                  Image
                </div>
              </div>
            </div>
            
            <div className="more-info" onClick={() => toggleExpanded(index)}>
              <div className={`play-icon ${expandedCards[index] ? 'expanded' : ''}`}>
                {expandedCards[index] ? '▼' : '▶'}
              </div>
              <span>More Info</span>
            </div>
            
            {expandedCards[index] && (
              <div className="rating-examples">
                <div className="rating-grid">
                  {dimension.ratingExamples.map((example, exampleIndex) => (
                    <div key={exampleIndex} className="rating-example">
                      <div className="rating-stars">{example.stars}</div>
                      <div className="rating-number">({example.rating}):</div>
                      <div className="rating-example-image">
                        {example.example}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearnPage;
