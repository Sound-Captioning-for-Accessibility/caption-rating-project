import React, { useState } from 'react';
import './LearnPage.css';

const LearnPage = () => {
  const [expandedCards, setExpandedCards] = useState({});
  const dimensions = [
    {
      title: "Accuracy",
      description: "How closely the captions match the spoken dialogue. High accuracy means the words, phrasing, and meaning are correctly captured without misheard words, omissions, or added content.",
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
      description: "How well the captions appear and disappear in sync with the audio. Good timing ensures captions show up when the words are spoken and stay on screen long enough to be comfortably read.",
      ratingExamples: [
        { rating: 1.0, stars: "★☆☆☆☆", example: "Example" },
        { rating: 2.0, stars: "★★☆☆☆", example: "Example" },
        { rating: 3.0, stars: "★★★☆☆", example: "Example" },
        { rating: 4.0, stars: "★★★★☆", example: "Example" },
        { rating: 5.0, stars: "★★★★★", example: "Example" }
      ]
    },
    {
      title: "Non-Speech Information (NSI)",
      description: "How effectively captions represent important sounds that aren’t spoken words, such as music cues, sound effects, or speaker labels. Strong NSI includes relevant sounds that help viewers understand what’s happening.",
      ratingExamples: [
        { rating: 1.0, stars: "★☆☆☆☆", example: "Example" },
        { rating: 2.0, stars: "★★☆☆☆", example: "Example" },
        { rating: 3.0, stars: "★★★☆☆", example: "Example" },
        { rating: 4.0, stars: "★★★★☆", example: "Example" },
        { rating: 5.0, stars: "★★★★★", example: "Example" }
      ]
    },
    {
      title: "Layout",
      description: "How clear and readable the captions are in terms of placement, formatting, and line breaks. Good layout avoids covering important visuals, keeps text organized, and uses consistent styling that supports easy reading.",
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
