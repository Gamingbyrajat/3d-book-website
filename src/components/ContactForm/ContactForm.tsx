import { useState } from 'react';
import { useBookStore } from '../../store';
import { numSpreads } from '../../content/pages';
import './ContactForm.css';

export function ContactForm() {
  const progress = useBookStore((s) => s.progress);
  const [submitted, setSubmitted] = useState(false);

  // Only show form when the back cover has fully landed on the left
  const showStart = numSpreads - 1.15;
  const showEnd = numSpreads - 1;
  const isVisible = progress >= showStart;

  if (!isVisible) return null;

  // Quick fade-in over a short range at the very end
  const fadeAmount = Math.min(1, (progress - showStart) / (showEnd - showStart));
  const translateY = (1 - fadeAmount) * 20;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div
      className="contact-section"
      style={{
        opacity: fadeAmount,
        transform: `translateY(${translateY}px)`,
        pointerEvents: fadeAmount > 0.3 ? 'auto' : 'none',
      }}
    >
      <div className="contact-content">
        {submitted ? (
          <div className="contact-success">
            <p className="contact-eyebrow">Message Sent</p>
            <h2 className="contact-title">
              Thank <em>You</em>
            </h2>
            <p className="contact-description">
              We appreciate your interest. We'll get back to you shortly.
            </p>
          </div>
        ) : (
          <>
            <p className="contact-eyebrow">Let's Connect</p>
            <h2 className="contact-title">
              Get in <em>Touch</em>
            </h2>
            <p className="contact-description">
              Enjoyed the journey? We'd love to hear from you. Leave your details and let's start a conversation.
            </p>
            <form onSubmit={handleSubmit} className="contact-form">
              <input
                type="text"
                placeholder="Your Name"
                className="contact-input"
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                className="contact-input"
                required
              />
              <textarea
                placeholder="Tell us what you're looking for..."
                className="contact-input contact-textarea"
                rows={3}
              />
              <button type="submit" className="contact-cta">
                Send Message
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="contact-arrow">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
