import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const HERO_IMAGES = [
  {
    src: 'https://images.pexels.com/photos/1205651/pexels-photo-1205651.jpeg?auto=compress&cs=tinysrgb&w=1400',
    alt: 'University students studying together in a modern learning space',
  },
  {
    src: 'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=1400',
    alt: 'Campus library interior with study desks and academic resources',
  },
  {
    src: 'https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg?auto=compress&cs=tinysrgb&w=1400',
    alt: 'Lecture hall setup prepared for student classes and learning sessions',
  },
];

const LandingPage = () => {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const showPrev = () => {
    setActiveImage((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  };

  const showNext = () => {
    setActiveImage((prev) => (prev + 1) % HERO_IMAGES.length);
  };

  return (
    <div className="login-page landing-page">
      <header className="login-navbar">
        <div className="login-brand">
          <span className="login-brand-mark">SC</span>
          <span className="login-brand-name">Smart Campus Operations Hub</span>
        </div>

        <nav className="login-nav-links" aria-label="Public navigation">
          <a href="#hero" className="login-nav-link">Home</a>
          <a href="#resources" className="login-nav-link">Resources</a>
          <a href="#bookings" className="login-nav-link">Bookings</a>
          <a href="#maintenance" className="login-nav-link">Maintenance</a>
        </nav>

        <div className="login-nav-actions">
          <Link to="/register" className="login-btn login-btn-primary">
            Register
          </Link>
          <Link to="/login" className="login-btn login-btn-outline">
            Login
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <section id="hero" className="landing-hero fade-in">
          <p className="landing-kicker">Smart Campus Operations Hub</p>
          <h1>One portal for campus resources, bookings, and services</h1>
          <p className="landing-subtitle">
            Empower students and staff to discover spaces, reserve facilities,
            and manage campus services with clarity and speed.
          </p>
          <div style={{ marginTop: '20px' }}>
            <div
              style={{
                position: 'relative',
                borderRadius: '14px',
                overflow: 'hidden',
                height: '290px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
              }}
            >
              <img
                src={HERO_IMAGES[activeImage].src}
                alt={HERO_IMAGES[activeImage].alt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <button
                type="button"
                onClick={showPrev}
                aria-label="Show previous image"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  width: '34px',
                  height: '34px',
                  borderRadius: '999px',
                  background: 'rgba(15, 23, 42, 0.55)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '20px',
                  lineHeight: 1,
                }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Show next image"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  width: '34px',
                  height: '34px',
                  borderRadius: '999px',
                  background: 'rgba(15, 23, 42, 0.55)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '20px',
                  lineHeight: 1,
                }}
              >
                ›
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px',
              }}
              aria-label="Hero image indicators"
            >
              {HERO_IMAGES.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  aria-label={`Show image ${index + 1}`}
                  onClick={() => setActiveImage(index)}
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '999px',
                    border: 'none',
                    cursor: 'pointer',
                    background: index === activeImage ? '#2563eb' : '#cbd5e1',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="landing-cta">
            <Link to="/register" className="login-btn login-btn-primary">
              Register
            </Link>
            <Link to="/login" className="login-btn login-btn-outline">
              Login
            </Link>
          </div>
        </section>

        <section id="resources" className="landing-section slide-up">
          <h2>Resources</h2>
          <div className="landing-grid">
            <article className="landing-card">
              <h3>Discover campus facilities</h3>
              <p>
                Students and staff can explore available rooms, labs, equipment,
                and study spaces from one organized directory.
              </p>
            </article>
            <article className="landing-card">
              <h3>View details instantly</h3>
              <p>
                Check capacity, location, and availability quickly before
                planning your session or event.
              </p>
            </article>
          </div>
        </section>

        <section id="bookings" className="landing-section slide-up">
          <h2>Bookings</h2>
          <div className="landing-grid">
            <article className="landing-card">
              <h3>Reserve efficiently</h3>
              <p>
                Book rooms, labs, and equipment through a streamlined process
                built for busy academic schedules.
              </p>
            </article>
            <article className="landing-card">
              <h3>Avoid conflicts</h3>
              <p>
                Improve planning and reduce scheduling clashes with clear
                visibility into resource availability.
              </p>
            </article>
          </div>
        </section>

        <section id="maintenance" className="landing-section slide-up">
          <h2>Maintenance and Support</h2>
          <div className="landing-grid landing-grid-single">
            <article className="landing-card">
              <h3>Report and track issues</h3>
              <p>
                Submit maintenance requests, monitor status updates, and improve
                resolution transparency across campus operations.
              </p>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
