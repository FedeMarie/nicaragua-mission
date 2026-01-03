import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore';

// ============================================
// 🔥 FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyBCEzrVt-bOulU8z0pz99CmAnfNIF-96_c",
  authDomain: "nicaragua-mission.firebaseapp.com",
  projectId: "nicaragua-mission",
  storageBucket: "nicaragua-mission.firebasestorage.app",
  messagingSenderId: "82891897684",
  appId: "1:82891897684:web:0bc824bdfb83acc450a6c1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================
// 🎯 UPDATE THESE VALUES DIRECTLY
// ============================================
const CONFIG = {
  // Your Formspree form ID (from formspree.io)
  FORMSPREE_ID: 'mblnvpkr',
  
  // Current amount raised - UPDATE THIS when you receive donations!
  AMOUNT_RAISED: 480,
  
  // Fundraising goal
  GOAL: 2000,
};
// ============================================

// Warm Central American inspired color palette
const colors = {
  terracotta: '#C4694E',
  terracottaLight: '#D98E73',
  terracottaDark: '#A3523A',
  sunYellow: '#E8B84A',
  sunYellowLight: '#F5D280',
  forestGreen: '#2D5A45',
  forestGreenLight: '#4A7A62',
  cream: '#FDF8F3',
  warmWhite: '#FFFCF8',
  earthBrown: '#5C4033',
  softSand: '#E8DFD5',
};

const NicaraguaMissionDashboard = () => {
  const [raised, setRaised] = useState(CONFIG.AMOUNT_RAISED);
  const [expandedEntries, setExpandedEntries] = useState({ entry1: true });
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [prayerCommitments, setPrayerCommitments] = useState([]);
  const [newPrayerName, setNewPrayerName] = useState('');
  const [newPrayerNote, setNewPrayerNote] = useState('');
  const [isLoadingPrayers, setIsLoadingPrayers] = useState(true);
  const [isSubmittingPrayer, setIsSubmittingPrayer] = useState(false);
  const [prayerError, setPrayerError] = useState('');
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState(''); // 'loading', 'success', 'error'
  const [subscribeMessage, setSubscribeMessage] = useState('');
  const goal = CONFIG.GOAL;

  // Save a new prayer commitment to Firebase
  const submitPrayerCommitment = async () => {
    if (!newPrayerName.trim()) return;
    
    setIsSubmittingPrayer(true);
    setPrayerError('');
    
    try {
      const newCommitment = {
        name: newPrayerName.trim(),
        note: newPrayerNote.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: Date.now()
      };
      
      const docRef = await addDoc(collection(db, 'prayers'), newCommitment);
      
      // Add to local state with the Firebase doc ID
      setPrayerCommitments(prev => [{ id: docRef.id, ...newCommitment }, ...prev]);
      setNewPrayerName('');
      setNewPrayerNote('');
    } catch (error) {
      console.error('Error adding prayer:', error);
      setPrayerError('Unable to add prayer. Please try again.');
      setTimeout(() => setPrayerError(''), 5000);
    }
    
    setIsSubmittingPrayer(false);
  };

  // Handle email subscription
  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!subscribeEmail.trim()) return;
    
    setSubscribeStatus('loading');
    setSubscribeMessage('');
    
    try {
      const response = await fetch(`https://formspree.io/f/${CONFIG.FORMSPREE_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: subscribeEmail,
          _subject: 'New Newsletter Subscription - Nicaragua Mission',
        }),
      });
      
      if (response.ok) {
        setSubscribeStatus('success');
        setSubscribeMessage('Thanks for subscribing! You\'ll hear from me soon. ✨');
        setSubscribeEmail('');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubscribeStatus('');
          setSubscribeMessage('');
        }, 5000);
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      setSubscribeStatus('error');
      setSubscribeMessage('Oops! Something went wrong. Please try again or email me directly.');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSubscribeStatus('');
        setSubscribeMessage('');
      }, 5000);
    }
  };

  useEffect(() => {
    // Load prayer commitments on mount
    const loadPrayerCommitments = async () => {
      setIsLoadingPrayers(true);
      try {
        const prayersQuery = query(collection(db, 'prayers'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(prayersQuery);
        const prayers = [];
        querySnapshot.forEach((doc) => {
          prayers.push({ id: doc.id, ...doc.data() });
        });
        setPrayerCommitments(prayers);
      } catch (error) {
        console.error('Error loading prayers:', error);
        // If orderBy fails (no index), try without ordering
        try {
          const fallbackSnapshot = await getDocs(collection(db, 'prayers'));
          const prayers = [];
          fallbackSnapshot.forEach((doc) => {
            prayers.push({ id: doc.id, ...doc.data() });
          });
          // Sort client-side as fallback
          prayers.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setPrayerCommitments(prayers);
        } catch (fallbackError) {
          console.error('Error loading prayers (fallback):', fallbackError);
        }
      }
      setIsLoadingPrayers(false);
    };
    
    loadPrayerCommitments();
  }, []);

  useEffect(() => {
    // Trigger entrance animations
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Animate progress bar
    const targetProgress = (raised / goal) * 100;
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setAnimatedProgress(targetProgress * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [raised, goal]);

  const toggleEntry = (entryId) => {
    setExpandedEntries(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const shareText = "I'm going on my first mission trip to Nicaragua to serve children and mothers alongside local community churches! Would you consider partnering with me through prayer or giving?";
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  const handleShare = (platform) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      email: `mailto:?subject=${encodeURIComponent("Join me on my Nicaragua Mission Trip!")}&body=${encodedText}%0A%0ALearn more and give here: ${encodedUrl}`,
    };
    
    if (platform === 'email') {
      window.location.href = urls[platform];
    } else {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.cream,
      fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
      color: colors.earthBrown,
      overflowX: 'hidden',
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Sans+3:wght@300;400;500;600&display=swap" rel="stylesheet" />
      
      {/* Decorative background pattern */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 80%, ${colors.terracotta}08 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, ${colors.forestGreen}08 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, ${colors.sunYellow}05 0%, transparent 70%)
        `,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Header Section */}
        <header style={{
          background: `linear-gradient(135deg, ${colors.forestGreen} 0%, ${colors.forestGreenLight} 100%)`,
          padding: '60px 20px 80px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative textile pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 10px, ${colors.cream} 10px, ${colors.cream} 11px),
              repeating-linear-gradient(-45deg, transparent, transparent 10px, ${colors.cream} 10px, ${colors.cream} 11px)
            `,
            pointerEvents: 'none',
          }} />
          
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease-out',
          }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 20px',
              backgroundColor: `${colors.sunYellow}30`,
              borderRadius: '50px',
              marginBottom: '20px',
            }}>
              <span style={{
                fontFamily: '"Source Sans 3", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: colors.sunYellowLight,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}>February 16-23, 2026</span>
            </div>
            
            <h1 style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 600,
              color: colors.warmWhite,
              margin: '0 0 10px',
              lineHeight: 1.2,
            }}>Nicaragua Mission Trip</h1>
            
            <p style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              fontStyle: 'italic',
              color: colors.softSand,
              margin: '0',
              fontWeight: 400,
            }}>Matagalpa & Managua, Nicaragua</p>
          </div>
          
          {/* Decorative wave */}
          <svg style={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            width: '100%',
            height: '50px',
          }} viewBox="0 0 1200 50" preserveAspectRatio="none">
            <path d="M0,50 L0,20 Q300,50 600,20 T1200,20 L1200,50 Z" fill={colors.cream} />
          </svg>
        </header>

        {/* Fundraising Progress Section */}
        <section id="donate" style={{
          maxWidth: '800px',
          margin: '-30px auto 0',
          padding: '0 20px',
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{
            backgroundColor: colors.warmWhite,
            borderRadius: '24px',
            padding: 'clamp(30px, 5vw, 50px)',
            boxShadow: '0 20px 60px rgba(92, 64, 51, 0.1), 0 8px 20px rgba(92, 64, 51, 0.05)',
            border: `1px solid ${colors.softSand}`,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out 0.2s',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 600,
                color: colors.forestGreen,
                margin: '0 0 10px',
              }}>Join My Journey</h2>
              <p style={{
                fontSize: '1rem',
                color: colors.earthBrown,
                opacity: 0.8,
                margin: 0,
              }}>Your gift supports food, lodging, travel, and supplies for children's activities</p>
            </div>
            
            {/* Progress Bar */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '12px',
              }}>
                <span style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 'clamp(2rem, 5vw, 2.5rem)',
                  fontWeight: 600,
                  color: colors.terracotta,
                }}>${raised.toLocaleString()}</span>
                <span style={{
                  fontSize: '1rem',
                  color: colors.earthBrown,
                  opacity: 0.7,
                }}>of ${goal.toLocaleString()} goal</span>
              </div>
              
              <div style={{
                height: '16px',
                backgroundColor: colors.softSand,
                borderRadius: '50px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.max(animatedProgress, 0)}%`,
                  background: `linear-gradient(90deg, ${colors.terracotta} 0%, ${colors.sunYellow} 100%)`,
                  borderRadius: '50px',
                  transition: 'width 0.3s ease-out',
                  position: 'relative',
                  minWidth: animatedProgress > 0 ? '20px' : '0',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
                    borderRadius: '50px',
                  }} />
                </div>
              </div>
              
              <p style={{
                textAlign: 'center',
                marginTop: '10px',
                fontSize: '0.95rem',
                color: colors.forestGreen,
                fontWeight: 500,
              }}>{Math.round(animatedProgress)}% raised</p>
            </div>
            
            {/* Giving Amounts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
            }}>
              {[25, 50, 100, 200].map((amount) => (
                <a
                  key={amount}
                  href="https://aletheia.ccbchurch.com/goto/forms/1043/responses/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '16px 20px',
                    backgroundColor: colors.warmWhite,
                    border: `2px solid ${colors.terracottaLight}`,
                    borderRadius: '12px',
                    fontFamily: '"Source Sans 3", sans-serif',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: colors.terracotta,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = colors.terracotta;
                    e.currentTarget.style.color = colors.warmWhite;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = colors.warmWhite;
                    e.currentTarget.style.color = colors.terracotta;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  ${amount}
                </a>
              ))}
            </div>
            
            {/* Give Now Button */}
            <a
              href="https://aletheia.ccbchurch.com/goto/forms/1043/responses/new"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                padding: '18px 40px',
                background: `linear-gradient(135deg, ${colors.forestGreen} 0%, ${colors.forestGreenLight} 100%)`,
                border: 'none',
                borderRadius: '50px',
                fontFamily: '"Source Sans 3", sans-serif',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: colors.warmWhite,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: `0 4px 20px ${colors.forestGreen}40`,
                textDecoration: 'none',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 30px ${colors.forestGreen}50`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 20px ${colors.forestGreen}40`;
              }}
            >
              ✨ Give Now
            </a>
            
            <p style={{
              textAlign: 'center',
              marginTop: '15px',
              fontSize: '0.85rem',
              color: colors.earthBrown,
              opacity: 0.7,
              fontStyle: 'italic',
            }}>All donations are tax-deductible</p>
          </div>
        </section>

        {/* Navigation */}
        <nav style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          padding: '40px 20px 20px',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'My Letter', id: 'entry1' },
            { label: 'Training', id: 'entry2' },
            { label: 'Curriculum', id: 'entry3' },
            { label: 'Español', id: 'entry4' },
            { label: 'Prayer', id: 'entry5' },
            { label: 'Recap 1', id: 'entry6' },
            { label: 'Recap 2', id: 'entry7' },
            { label: 'Recap 3', id: 'entry8' },
            { label: '💌 Newsletter', id: 'newsletter' },
            { label: '🙏 Prayer Wall', id: 'prayer-wall' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: 'none',
                fontFamily: '"Source Sans 3", sans-serif',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: colors.forestGreen,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = colors.terracotta;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = colors.forestGreen;
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Blog Entries Section */}
        <section style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '20px 20px 60px',
        }}>
          
          {/* Entry 1: MPD Letter */}
          <article id="entry1" style={{
            backgroundColor: colors.warmWhite,
            borderRadius: '20px',
            marginBottom: '24px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(92, 64, 51, 0.08)',
            border: `1px solid ${colors.softSand}`,
          }}>
            <button
              onClick={() => toggleEntry('entry1')}
              style={{
                width: '100%',
                padding: '28px 30px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: `${colors.terracotta}15`,
                  borderRadius: '50px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: colors.terracotta,
                  }}>December 2025 • Featured</span>
                </div>
                <h3 style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
                  fontWeight: 600,
                  color: colors.forestGreen,
                  margin: 0,
                }}>An Invitation to Partner</h3>
              </div>
              <span style={{
                fontSize: '1.5rem',
                color: colors.terracotta,
                transform: expandedEntries.entry1 ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s ease',
              }}>▾</span>
            </button>
            
            {expandedEntries.entry1 && (
              <div style={{
                padding: '0 30px 35px',
                animation: 'fadeIn 0.4s ease',
              }}>
                <style>{`
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                `}</style>
                
                <div style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.85,
                  color: colors.earthBrown,
                }}>
                  <p style={{ marginTop: 0 }}>
                    <span style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: '3.5rem',
                      float: 'left',
                      lineHeight: 1,
                      marginRight: '12px',
                      marginTop: '5px',
                      color: colors.terracotta,
                    }}>D</span>
                    ear friend,
                  </p>
                  
                  <p>
                    I'm writing to share exciting news—and I'd love for you to be part of it.
                  </p>
                  
                  <p>
                    <strong style={{ color: colors.forestGreen }}>This February, I'm embarking on my very first mission trip</strong>, 
                    traveling to rural Nicaragua with a team to serve alongside <em>Nourish</em>, an incredible organization 
                    dedicated to holistic child development and community empowerment. We'll be based in Matagalpa and 
                    Managua from February 16-23, 2026, working with the local community churches to serve the children and mothers in the community by meeting their practical needs and sharing the Gospel.
                  </p>
                  
                  <div style={{
                    backgroundColor: colors.cream,
                    borderLeft: `4px solid ${colors.sunYellow}`,
                    padding: '20px 25px',
                    margin: '25px 0',
                    borderRadius: '0 12px 12px 0',
                  }}>
                    <h4 style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: '1.15rem',
                      color: colors.forestGreen,
                      margin: '0 0 12px',
                    }}>Why This Matters to Me</h4>
                    <p style={{ margin: 0 }}>
                      As a <strong>passionate early childhood educator</strong>, I believe every child deserves love, safety, 
                      and the opportunity to thrive. I've dedicated my career to the welfare of children, and this 
                      trip allows me to extend that calling beyond borders. The vision and mission of Nourish resonates deeply with my vocation—I want to bring hope, joy, and tangible support to these 
                      precious lives and be faithful to letting God work on me as well.
                    </p>
                  </div>
                  
                  <h4 style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.15rem',
                    color: colors.forestGreen,
                    margin: '30px 0 15px',
                  }}>What We'll Be Doing</h4>
                  
                  <p>
                    Our team will prepare and lead <strong>kids activities and educational programming</strong>, supporting 
                    trauma-informed, child-centered curriculum developed specifically for this community. We'll come 
                    alongside single mothers with encouragement and practical support during house visits, and visit and lend encouragement to 3 different churches in 3 different regions. All to reflect the love of Christ.
                  </p>
                  
                  <div style={{
                    backgroundColor: `${colors.forestGreen}08`,
                    borderRadius: '16px',
                    padding: '25px 30px',
                    margin: '30px 0',
                    textAlign: 'center',
                  }}>
                    <h4 style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: '1.3rem',
                      color: colors.forestGreen,
                      margin: '0 0 10px',
                    }}>The Ask</h4>
                    <p style={{
                      fontSize: '2rem',
                      fontWeight: 600,
                      color: colors.terracotta,
                      margin: '0 0 10px',
                      fontFamily: '"Playfair Display", Georgia, serif',
                    }}>$2,000</p>
                    <p style={{ margin: '0 0 15px', opacity: 0.9 }}>
                      covers food, lodging, travel, AND supplies for children's activities
                    </p>
                    <p style={{
                      fontStyle: 'italic',
                      color: colors.forestGreen,
                      margin: 0,
                      fontWeight: 500,
                    }}>
                      Even $25 provides supplies for a full day of activities with the children
                    </p>
                  </div>
                  
                  <h4 style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.15rem',
                    color: colors.forestGreen,
                    margin: '30px 0 15px',
                  }}>Learn More About Nourish</h4>
                  
                  <div style={{
                    display: 'grid',
                    gap: '12px',
                    marginBottom: '25px',
                  }}>
                    <a
                      href="https://nourish.yearly.report/gen-2025-youth-development-platform#/-O34mKgpd1IPM2uVBt8J"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 20px',
                        backgroundColor: colors.cream,
                        borderRadius: '12px',
                        textDecoration: 'none',
                        color: colors.earthBrown,
                        transition: 'all 0.3s ease',
                        border: `1px solid ${colors.softSand}`,
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateX(5px)';
                        e.currentTarget.style.borderColor = colors.terracottaLight;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = colors.softSand;
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>🌱</span>
                      <div>
                        <strong style={{ color: colors.forestGreen }}>Youth Development Platform</strong>
                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>See how Nourish is investing in the next generation</p>
                      </div>
                      <span style={{ marginLeft: 'auto', color: colors.terracotta }}>→</span>
                    </a>
                    
                    <a
                      href="https://nourish.yearly.report/2025-education-program#/-O34mKgpd1IPM2uVBt8J"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 20px',
                        backgroundColor: colors.cream,
                        borderRadius: '12px',
                        textDecoration: 'none',
                        color: colors.earthBrown,
                        transition: 'all 0.3s ease',
                        border: `1px solid ${colors.softSand}`,
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateX(5px)';
                        e.currentTarget.style.borderColor = colors.terracottaLight;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = colors.softSand;
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>📚</span>
                      <div>
                        <strong style={{ color: colors.forestGreen }}>2025 Education Program</strong>
                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Explore the educational initiatives transforming communities</p>
                      </div>
                      <span style={{ marginLeft: 'auto', color: colors.terracotta }}>→</span>
                    </a>
                  </div>
                  
                  <h4 style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.15rem',
                    color: colors.forestGreen,
                    margin: '30px 0 15px',
                  }}>Ways to Partner</h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginBottom: '30px',
                  }}>
                    <a
                      href="https://aletheia.ccbchurch.com/goto/forms/1043/responses/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '20px',
                        backgroundColor: `${colors.terracotta}10`,
                        borderRadius: '12px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        border: `2px solid transparent`,
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.terracotta}20`;
                        e.currentTarget.style.borderColor = colors.terracotta;
                        e.currentTarget.style.transform = 'translateY(-3px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.terracotta}10`;
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>💝</span>
                      <strong style={{ color: colors.terracotta }}>Give Financially</strong>
                      <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: colors.earthBrown }}>Every gift makes a difference</p>
                    </a>
                    
                    <button
                      onClick={() => scrollToSection('prayer-wall')}
                      style={{
                        padding: '20px',
                        backgroundColor: `${colors.forestGreen}10`,
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: `2px solid transparent`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        width: '100%',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.forestGreen}20`;
                        e.currentTarget.style.borderColor = colors.forestGreen;
                        e.currentTarget.style.transform = 'translateY(-3px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.forestGreen}10`;
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>🙏</span>
                      <strong style={{ color: colors.forestGreen }}>Commit to Pray</strong>
                      <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: colors.earthBrown }}>Join our prayer wall</p>
                    </button>
                    
                    <div style={{
                      padding: '20px',
                      backgroundColor: `${colors.sunYellow}20`,
                      borderRadius: '12px',
                      textAlign: 'center',
                    }}>
                      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>📖</span>
                      <strong style={{ color: colors.earthBrown }}>Follow Along</strong>
                      <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>Read my journey updates</p>
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: colors.cream,
                    borderRadius: '16px',
                    padding: '25px',
                    marginTop: '30px',
                    textAlign: 'center',
                  }}>
                    <p style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontStyle: 'italic',
                      fontSize: '1.1rem',
                      color: colors.forestGreen,
                      margin: 0,
                    }}>
                      Whether you give $25 or $200, pray daily, or simply share this page—you become part of this mission. 
                      Thank you for walking alongside me.
                    </p>
                    <p style={{
                      margin: '15px 0 0',
                      fontFamily: '"Playfair Display", Georgia, serif',
                      color: colors.terracotta,
                    }}>
                      With gratitude and hope,<br />
                      <strong>Emmanuella</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </article>

          {/* Entry 2: Training Week */}
          <article id="entry2" style={{
            backgroundColor: colors.warmWhite,
            borderRadius: '20px',
            marginBottom: '24px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(92, 64, 51, 0.08)',
            border: `1px solid ${colors.softSand}`,
          }}>
            <button
              onClick={() => toggleEntry('entry2')}
              style={{
                width: '100%',
                padding: '28px 30px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: `${colors.terracotta}15`,
                  borderRadius: '50px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: colors.terracotta,
                  }}>December 7-14, 2025</span>
                </div>
                <h3 style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
                  fontWeight: 600,
                  color: colors.forestGreen,
                  margin: 0,
                }}>Training Week: Learning the Heart of Nourish</h3>
              </div>
              <span style={{
                fontSize: '1.5rem',
                color: colors.terracotta,
                transform: expandedEntries.entry2 ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s ease',
              }}>▾</span>
            </button>
            
            {expandedEntries.entry2 && (
              <div style={{
                padding: '0 30px 35px',
                animation: 'fadeIn 0.4s ease',
              }}>
                <div style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.85,
                  color: colors.earthBrown,
                }}>
                  <p>
                    My home church, <strong style={{ color: colors.forestGreen }}>Aletheia</strong>, has been partnering with <strong style={{ color: colors.forestGreen }}>Nourish</strong> (formerly ORPHANetwork) since 2016. These last couple of weeks, our team got to meet virtually with Katie and David from Nourish International to learn about the history and culture of Nourish.
                  </p>
                  
                  <p>
                    Katie, who is US-based, taught us about how ORPHANetwork was started and how it was able to continue its programming—and even grow—through Nicaragua's redefinition of orphanages. Nourish partners with <strong>150 churches globally</strong> and collaborates with <strong>110 churches</strong> across various regions of Nicaragua. Through these churches, Nourish has helped provide food, clean water, medical care, education, life skills, and gospel ministry. Their work has impacted upwards of <strong style={{ color: colors.terracotta }}>20,000 children</strong>.
                  </p>
                  
                  <p>
                    With David, we learned a lot about the socioeconomic landscape of the country and what day-to-day life is like for the people living in Managua, Matagalpa, and a rural community 45 minutes away from Managua. These communities are served by the three local churches Aletheia partners with. While we're there in February, there will be a bit more work available as it will be <strong>coffee harvesting season</strong>. Other forms of income usually come through textile work and recycling bottles and cans found in the landfill.
                  </p>

                  {/* Block Quote - Why Churches */}
                  <div style={{
                    backgroundColor: colors.cream,
                    borderLeft: `4px solid ${colors.forestGreen}`,
                    padding: '20px 25px',
                    margin: '25px 0',
                    borderRadius: '0 12px 12px 0',
                  }}>
                    <p style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: '1.15rem',
                      fontStyle: 'italic',
                      color: colors.forestGreen,
                      margin: '0 0 12px',
                    }}>
                      "Why churches? Why not partner with local schools?"
                    </p>
                    <p style={{ margin: 0 }}>
                      Simple answer: <strong>Some communities don't have schools. But they have churches.</strong> The people of Nicaragua are truly bound and sustained by divine hope and love.
                    </p>
                  </div>

                  <h4 style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.15rem',
                    color: colors.forestGreen,
                    margin: '30px 0 15px',
                  }}>What We'll Be Doing</h4>
                  
                  <p>
                    And God truly provides—we went over what programming looks like in a day and drew out a rough sketch of who and how we will be serving for the week.
                  </p>
                  
                  <p>
                    We'll be visiting <strong style={{ color: colors.forestGreen }}>four pastors</strong> and encouraging them in the work they're already doing in their communities: <strong>Pastor Ochoa</strong> in Managua, <strong>Pastores Juan y José</strong> en Matagalpa, and <strong>Pastora Aluz Maria</strong>. This includes going to the market in the mornings and paying house visits to single mothers, where we gift them groceries, chat with them, and pray with them.
                  </p>
                  
                  <p>
                    In the afternoons, we'll participate in feeding children and curating trauma-informed, child-centered activities. David gave us a cheat code: <em>some children haven't yet seen a puppet show</em>. This generated a lot of excitement for our group!
                  </p>
                  
                  <p>
                    We'll also plan activities for the women—like bracelet making, makeup application, and other self-affirming activities.
                  </p>
                  
                  <p>
                    And the day before we leave happens to be a Sunday! So we've been invited to co-pastor with Pastora Aluz Maria and throw a celebration for the children afterwards. <strong style={{ color: colors.terracotta }}>(We get to go piñata shopping!)</strong>
                  </p>
                  
                  <p>
                    In total, we'll be serving about <strong style={{ color: colors.terracotta }}>300 children</strong> and <strong style={{ color: colors.terracotta }}>50 women</strong>.
                  </p>
                  
                  <p>
                    David highlighted how important it is to validate the work the pastors are doing—especially the female pastor we'll be visiting—so that the surrounding community feels safe to come and engage.
                  </p>

                  {/* Block Quote - Exciting News */}
                  <div style={{
                    backgroundColor: `${colors.sunYellow}20`,
                    borderLeft: `4px solid ${colors.sunYellow}`,
                    padding: '20px 25px',
                    margin: '25px 0',
                    borderRadius: '0 12px 12px 0',
                  }}>
                    <p style={{
                      fontWeight: 600,
                      color: colors.forestGreen,
                      margin: '0 0 8px',
                      fontSize: '1rem',
                    }}>✨ Exciting News!</p>
                    <p style={{ margin: 0 }}>
                      They plan to pilot a <strong>workforce development program</strong> for women to gain the skills needed for work available in their communities.
                    </p>
                  </div>

                </div>
              </div>
            )}
          </article>

          {/* Entry 3: Curriculum */}
          <article id="entry3" style={{
            backgroundColor: colors.warmWhite,
            borderRadius: '20px',
            marginBottom: '24px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(92, 64, 51, 0.08)',
            border: `1px solid ${colors.softSand}`,
          }}>
            <button
              onClick={() => toggleEntry('entry3')}
              style={{
                width: '100%',
                padding: '28px 30px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: `${colors.softSand}`,
                  borderRadius: '50px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: colors.earthBrown,
                    opacity: 0.7,
                  }}>January 11-18, 2026 • Coming Soon</span>
                </div>
                <h3 style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
                  fontWeight: 600,
                  color: colors.forestGreen,
                  margin: 0,
                }}>Building with Care: Trauma-Informed Curriculum</h3>
              </div>
              <span style={{
                fontSize: '1.5rem',
                color: colors.terracotta,
                transform: expandedEntries.entry3 ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s ease',
              }}>▾</span>
            </button>
            
            {expandedEntries.entry3 && (
              <div style={{
                padding: '0 30px 35px',
                animation: 'fadeIn 0.4s ease',
              }}>
                <p style={{
                  fontStyle: 'italic',
                  color: colors.earthBrown,
                  opacity: 0.9,
                  lineHeight: 1.8,
                }}>
                  This entry will document what I'm learning about creating children and women-centered, 
                  trauma-informed curriculum for community engagement. How do we build programming that 
                  heals rather than harms?
                </p>
                
                <div style={{
                  backgroundColor: colors.cream,
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '20px',
                }}>
                  <p style={{
                    fontWeight: 600,
                    color: colors.forestGreen,
                    margin: '0 0 12px',
                  }}>Topics I'll be exploring:</p>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    color: colors.earthBrown,
                    lineHeight: 1.8,
                  }}>
                    <li>Principles of trauma-informed care with children</li>
                    <li>Centering women and children in community development</li>
                    <li>Practical curriculum elements we're preparing</li>
                    <li>How early childhood education principles apply in this context</li>
                  </ul>
                </div>
              </div>
            )}
          </article>

          {/* Entry 4: Spanish */}
          <article id="entry4" style={{
            backgroundColor: colors.warmWhite,
            borderRadius: '20px',
            marginBottom: '24px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(92, 64, 51, 0.08)',
            border: `1px solid ${colors.softSand}`,
          }}>
            <button
              onClick={() => toggleEntry('entry4')}
              style={{
                width: '100%',
                padding: '28px 30px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: `${colors.softSand}`,
                  borderRadius: '50px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: colors.earthBrown,
                    opacity: 0.7,
                  }}>January 25, 2026 • Coming Soon</span>
                </div>
                <h3 style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
                  fontWeight: 600,
                  color: colors.forestGreen,
                  margin: 0,
                }}>Aprendiendo Español: Verses & Songs</h3>
              </div>
              <span style={{
                fontSize: '1.5rem',
                color: colors.terracotta,
                transform: expandedEntries.entry4 ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s ease',
              }}>▾</span>
            </button>
            
            {expandedEntries.entry4 && (
              <div style={{
                padding: '0 30px 35px',
                animation: 'fadeIn 0.4s ease',
              }}>
                <p style={{
                  fontStyle: 'italic',
                  color: colors.earthBrown,
                  opacity: 0.9,
                  lineHeight: 1.8,
                }}>
                  An update on my Spanish language journey! I'll share some of the Bible verses and 
                  worship songs I've been learning in Spanish as I prepare to connect heart-to-heart 
                  with the community.
                </p>
                
                <div style={{
                  backgroundColor: colors.cream,
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '20px',
                }}>
                  <p style={{
                    fontWeight: 600,
                    color: colors.forestGreen,
                    margin: '0 0 12px',
                  }}>Topics I'll be sharing:</p>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    color: colors.earthBrown,
                    lineHeight: 1.8,
                  }}>
                    <li>My Spanish learning progress</li>
                    <li>Favorite Bible verses in Spanish (with translations)</li>
                    <li>Worship songs I'm learning</li>
                    <li>The joy and challenge of language learning for ministry</li>
                  </ul>
                </div>
              </div>
            )}
          </article>

          {/* Entry 5: Prayer */}
          <article id="entry5" style={{
            backgroundColor: colors.warmWhite,
            borderRadius: '20px',
            marginBottom: '24px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(92, 64, 51, 0.08)',
            border: `1px solid ${colors.softSand}`,
          }}>
            <button
              onClick={() => toggleEntry('entry5')}
              style={{
                width: '100%',
                padding: '28px 30px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: `${colors.softSand}`,
                  borderRadius: '50px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: colors.earthBrown,
                    opacity: 0.7,
                  }}>February 1, 2026 • Coming Soon</span>
                </div>
                <h3 style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
                  fontWeight: 600,
                  color: colors.forestGreen,
                  margin: 0,
                }}>A Call to Prayer</h3>
              </div>
              <span style={{
                fontSize: '1.5rem',
                color: colors.terracotta,
                transform: expandedEntries.entry5 ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s ease',
              }}>▾</span>
            </button>
            
            {expandedEntries.entry5 && (
              <div style={{
                padding: '0 30px 35px',
                animation: 'fadeIn 0.4s ease',
              }}>
                <p style={{
                  fontStyle: 'italic',
                  color: colors.earthBrown,
                  opacity: 0.9,
                  lineHeight: 1.8,
                }}>
                  With just two weeks until departure, I'm inviting you into intentional, focused 
                  prayer for this trip. Here are specific ways you can lift up our team, the community 
                  in Nicaragua, and the work God is doing.
                </p>
                
                <div style={{
                  backgroundColor: colors.cream,
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '20px',
                }}>
                  <p style={{
                    fontWeight: 600,
                    color: colors.forestGreen,
                    margin: '0 0 12px',
                  }}>Prayer focuses:</p>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    color: colors.earthBrown,
                    lineHeight: 1.8,
                  }}>
                    <li>The team's preparation and unity</li>
                    <li>Safe travels</li>
                    <li>The children and mothers we'll serve</li>
                    <li>Open hearts and meaningful connections</li>
                    <li>Long-term impact beyond our visit</li>
                  </ul>
                </div>
              </div>
            )}
          </article>

          {/* Entry 6: Trip Recap Part 1 */}
          <article id="entry6" style={{
            backgroundColor: colors.warmWhite,
            borderRadius: '20px',
            marginBottom: '24px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(92, 64, 51, 0.08)',
            border: `1px solid ${colors.softSand}`,
          }}>
            <button
              onClick={() => toggleEntry('entry6')}
              style={{
                width: '100%',
                padding: '28px 30px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: `${colors.sunYellow}25`,
                  borderRadius: '50px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: colors.earthBrown,
                  }}>February 24, 2026 • Trip Recap</span>
                </div>
                <h3 style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
                  fontWeight: 600,
                  color: colors.forestGreen,
                  margin: 0,
                }}>Trip Recap Part 1: Arrival & First Impressions</h3>
              </div>
              <span style={{
                fontSize: '1.5rem',
                color: colors.terracotta,
                transform: expandedEntries.entry6 ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s ease',
              }}>▾</span>
            </button>
            
            {expandedEntries.entry6 && (
              <div style={{
                padding: '0 30px 35px',
                animation: 'fadeIn 0.4s ease',
              }}>
                <p style={{
                  fontStyle: 'italic',
                  color: colors.earthBrown,
                  opacity: 0.9,
                  lineHeight: 1.8,
                  marginBottom: '25px',
                }}>
                  The first moments stepping onto Nicaraguan soil, meeting our hosts, and beginning 
                  to understand the community we came to serve.
                </p>
                
                {/* Photo Gallery Placeholder */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '25px',
                }}>
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      style={{
                        aspectRatio: '4/3',
                        backgroundColor: colors.softSand,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px dashed ${colors.terracottaLight}`,
                      }}
                    >
                      <div style={{ textAlign: 'center', color: colors.earthBrown, opacity: 0.6 }}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📷</span>
                        <span style={{ fontSize: '0.85rem' }}>Photo {num}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Reflection Area */}
                <div style={{
                  backgroundColor: colors.cream,
                  borderRadius: '12px',
                  padding: '25px',
                  borderLeft: `4px solid ${colors.sunYellow}`,
                }}>
                  <h4 style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.1rem',
                    color: colors.forestGreen,
                    margin: '0 0 15px',
                  }}>Personal Reflections</h4>
                  <p style={{
                    color: colors.earthBrown,
                    opacity: 0.7,
                    fontStyle: 'italic',
                    margin: 0,
                    lineHeight: 1.8,
                  }}>
                    [Your reflections on arriving in Nicaragua, first impressions of the land and people, 
                    and the emotions of beginning this journey will go here...]
                  </p>
                </div>
              </div>
            )}
          </article>

          {/* Entry 7: Trip Recap Part 2 */}
          <article id="entry7" style={{
            backgroundColor: colors.warmWhite,
            borderRadius: '20px',
            marginBottom: '24px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(92, 64, 51, 0.08)',
            border: `1px solid ${colors.softSand}`,
          }}>
            <button
              onClick={() => toggleEntry('entry7')}
              style={{
                width: '100%',
                padding: '28px 30px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: `${colors.sunYellow}25`,
                  borderRadius: '50px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: colors.earthBrown,
                  }}>February 26, 2026 • Trip Recap</span>
                </div>
                <h3 style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
                  fontWeight: 600,
                  color: colors.forestGreen,
                  margin: 0,
                }}>Trip Recap Part 2: The Heart of the Work</h3>
              </div>
              <span style={{
                fontSize: '1.5rem',
                color: colors.terracotta,
                transform: expandedEntries.entry7 ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s ease',
              }}>▾</span>
            </button>
            
            {expandedEntries.entry7 && (
              <div style={{
                padding: '0 30px 35px',
                animation: 'fadeIn 0.4s ease',
              }}>
                <p style={{
                  fontStyle: 'italic',
                  color: colors.earthBrown,
                  opacity: 0.9,
                  lineHeight: 1.8,
                  marginBottom: '25px',
                }}>
                  Stories from the days spent with the children and mothers—the activities we led, 
                  the connections we made, and the moments that moved us.
                </p>
                
                {/* Photo Gallery Placeholder */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '25px',
                }}>
                  {[1, 2, 3, 4].map((num) => (
                    <div
                      key={num}
                      style={{
                        aspectRatio: '4/3',
                        backgroundColor: colors.softSand,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px dashed ${colors.terracottaLight}`,
                      }}
                    >
                      <div style={{ textAlign: 'center', color: colors.earthBrown, opacity: 0.6 }}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📷</span>
                        <span style={{ fontSize: '0.85rem' }}>Photo {num}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Reflection Area */}
                <div style={{
                  backgroundColor: colors.cream,
                  borderRadius: '12px',
                  padding: '25px',
                  borderLeft: `4px solid ${colors.sunYellow}`,
                }}>
                  <h4 style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.1rem',
                    color: colors.forestGreen,
                    margin: '0 0 15px',
                  }}>Personal Reflections</h4>
                  <p style={{
                    color: colors.earthBrown,
                    opacity: 0.7,
                    fontStyle: 'italic',
                    margin: 0,
                    lineHeight: 1.8,
                  }}>
                    [Your reflections on the ministry work—special moments with the children, conversations 
                    with mothers, how God showed up in unexpected ways, and what you learned about serving 
                    with humility will go here...]
                  </p>
                </div>
              </div>
            )}
          </article>

          {/* Entry 8: Trip Recap Part 3 */}
          <article id="entry8" style={{
            backgroundColor: colors.warmWhite,
            borderRadius: '20px',
            marginBottom: '24px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(92, 64, 51, 0.08)',
            border: `1px solid ${colors.softSand}`,
          }}>
            <button
              onClick={() => toggleEntry('entry8')}
              style={{
                width: '100%',
                padding: '28px 30px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: `${colors.sunYellow}25`,
                  borderRadius: '50px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: colors.earthBrown,
                  }}>March 1, 2026 • Trip Recap</span>
                </div>
                <h3 style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
                  fontWeight: 600,
                  color: colors.forestGreen,
                  margin: 0,
                }}>Trip Recap Part 3: Coming Home Changed</h3>
              </div>
              <span style={{
                fontSize: '1.5rem',
                color: colors.terracotta,
                transform: expandedEntries.entry8 ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s ease',
              }}>▾</span>
            </button>
            
            {expandedEntries.entry8 && (
              <div style={{
                padding: '0 30px 35px',
                animation: 'fadeIn 0.4s ease',
              }}>
                <p style={{
                  fontStyle: 'italic',
                  color: colors.earthBrown,
                  opacity: 0.9,
                  lineHeight: 1.8,
                  marginBottom: '25px',
                }}>
                  Final reflections on saying goodbye, what this experience has planted in my heart, 
                  and how I'm carrying Nicaragua home with me.
                </p>
                
                {/* Photo Gallery Placeholder */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '25px',
                }}>
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      style={{
                        aspectRatio: '4/3',
                        backgroundColor: colors.softSand,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px dashed ${colors.terracottaLight}`,
                      }}
                    >
                      <div style={{ textAlign: 'center', color: colors.earthBrown, opacity: 0.6 }}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📷</span>
                        <span style={{ fontSize: '0.85rem' }}>Photo {num}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Reflection Area */}
                <div style={{
                  backgroundColor: colors.cream,
                  borderRadius: '12px',
                  padding: '25px',
                  borderLeft: `4px solid ${colors.sunYellow}`,
                }}>
                  <h4 style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.1rem',
                    color: colors.forestGreen,
                    margin: '0 0 15px',
                  }}>Personal Reflections</h4>
                  <p style={{
                    color: colors.earthBrown,
                    opacity: 0.7,
                    fontStyle: 'italic',
                    margin: 0,
                    lineHeight: 1.8,
                  }}>
                    [Your final reflections—what surprised you, what challenged you, how this experience 
                    has shaped your faith and calling, gratitude for your partners who made this possible, 
                    and dreams for continued connection will go here...]
                  </p>
                </div>
                
                {/* Thank You Note */}
                <div style={{
                  backgroundColor: `${colors.forestGreen}10`,
                  borderRadius: '12px',
                  padding: '25px',
                  marginTop: '20px',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>💚</span>
                  <h4 style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.1rem',
                    color: colors.forestGreen,
                    margin: '0 0 10px',
                  }}>Thank You</h4>
                  <p style={{
                    color: colors.earthBrown,
                    margin: 0,
                    lineHeight: 1.8,
                  }}>
                    To everyone who gave, prayed, and encouraged me along the way—you were part of this 
                    journey. Thank you for believing in this mission and in me.
                  </p>
                </div>
              </div>
            )}
          </article>
        </section>

        {/* Email Newsletter Section */}
        <section id="newsletter" style={{
          backgroundColor: colors.warmWhite,
          padding: '80px 20px',
          position: 'relative',
        }}>
          <div style={{
            maxWidth: '700px',
            margin: '0 auto',
            textAlign: 'center',
          }}>
            {/* Section Header */}
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '15px' }}>💌</span>
            <h2 style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 'clamp(1.8rem, 4vw, 2.3rem)',
              fontWeight: 600,
              color: colors.forestGreen,
              margin: '0 0 15px',
            }}>Stay Connected</h2>
            <p style={{
              fontSize: '1.1rem',
              color: colors.earthBrown,
              lineHeight: 1.7,
              marginBottom: '35px',
            }}>
              Get updates on my preparation, training insights, and trip recaps delivered straight to your inbox.
            </p>

            {/* Email Signup Form */}
            <form
              onSubmit={handleSubscribe}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                maxWidth: '500px',
                margin: '0 auto',
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    required
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    disabled={subscribeStatus === 'loading' || subscribeStatus === 'success'}
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      padding: '16px 20px',
                      border: `2px solid ${subscribeStatus === 'error' ? colors.terracotta : colors.softSand}`,
                      borderRadius: '50px',
                      fontSize: '1rem',
                      fontFamily: '"Source Sans 3", sans-serif',
                      backgroundColor: subscribeStatus === 'success' ? `${colors.forestGreen}10` : colors.cream,
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      opacity: subscribeStatus === 'success' ? 0.7 : 1,
                    }}
                    onFocus={(e) => {
                      if (subscribeStatus !== 'error') {
                        e.currentTarget.style.borderColor = colors.forestGreen;
                      }
                    }}
                    onBlur={(e) => {
                      if (subscribeStatus !== 'error') {
                        e.currentTarget.style.borderColor = colors.softSand;
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={subscribeStatus === 'loading' || subscribeStatus === 'success'}
                    style={{
                      padding: '16px 35px',
                      background: subscribeStatus === 'success' 
                        ? `linear-gradient(135deg, ${colors.forestGreen} 0%, ${colors.forestGreenLight} 100%)`
                        : `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                      border: 'none',
                      borderRadius: '50px',
                      fontFamily: '"Source Sans 3", sans-serif',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: colors.warmWhite,
                      cursor: subscribeStatus === 'loading' || subscribeStatus === 'success' ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: `0 4px 15px ${subscribeStatus === 'success' ? colors.forestGreen : colors.terracotta}30`,
                      whiteSpace: 'nowrap',
                      opacity: subscribeStatus === 'loading' || subscribeStatus === 'success' ? 0.7 : 1,
                    }}
                    onMouseOver={(e) => {
                      if (subscribeStatus !== 'loading' && subscribeStatus !== 'success') {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 6px 20px ${colors.terracotta}40`;
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 4px 15px ${subscribeStatus === 'success' ? colors.forestGreen : colors.terracotta}30`;
                    }}
                  >
                    {subscribeStatus === 'loading' ? 'Subscribing...' : 
                     subscribeStatus === 'success' ? '✓ Subscribed!' : 
                     'Subscribe'}
                  </button>
                </div>
                
                {/* Status Message */}
                {subscribeMessage && (
                  <div style={{
                    padding: '12px 20px',
                    borderRadius: '50px',
                    backgroundColor: subscribeStatus === 'success' ? `${colors.forestGreen}15` : `${colors.terracotta}15`,
                    color: subscribeStatus === 'success' ? colors.forestGreen : colors.terracotta,
                    fontSize: '0.95rem',
                    textAlign: 'center',
                    fontWeight: 500,
                    animation: 'fadeIn 0.3s ease',
                  }}>
                    {subscribeMessage}
                  </div>
                )}
              </div>
              
              <p style={{
                fontSize: '0.85rem',
                color: colors.earthBrown,
                opacity: 0.7,
                margin: '5px 0 0',
                fontStyle: 'italic',
              }}>
                I'll send updates as I prepare for and experience this journey. Unsubscribe anytime.
              </p>
            </form>

            {/* Features Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginTop: '50px',
            }}>
              <div style={{
                padding: '20px',
                backgroundColor: `${colors.forestGreen}08`,
                borderRadius: '12px',
              }}>
                <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>📖</span>
                <strong style={{ color: colors.forestGreen, fontSize: '0.95rem' }}>
                  Training Updates
                </strong>
              </div>
              
              <div style={{
                padding: '20px',
                backgroundColor: `${colors.sunYellow}20`,
                borderRadius: '12px',
              }}>
                <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>✈️</span>
                <strong style={{ color: colors.earthBrown, fontSize: '0.95rem' }}>
                  Trip Recaps
                </strong>
              </div>
              
              <div style={{
                padding: '20px',
                backgroundColor: `${colors.terracotta}15`,
                borderRadius: '12px',
              }}>
                <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>📸</span>
                <strong style={{ color: colors.terracotta, fontSize: '0.95rem' }}>
                  Photos & Stories
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Prayer Wall Section */}
        <section id="prayer-wall" style={{
          backgroundColor: colors.softSand,
          padding: '60px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 10% 20%, ${colors.sunYellow}15 0%, transparent 40%),
              radial-gradient(circle at 90% 80%, ${colors.terracotta}10 0%, transparent 40%)
            `,
            pointerEvents: 'none',
          }} />
          
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            position: 'relative',
          }}>
            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>🙏</span>
              <h2 style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: 600,
                color: colors.forestGreen,
                margin: '0 0 15px',
              }}>Prayer Wall</h2>
              <p style={{
                fontSize: '1.1rem',
                color: colors.earthBrown,
                maxWidth: '500px',
                margin: '0 auto',
                lineHeight: 1.7,
              }}>
                Join others in lifting up this mission. Leave your name and an encouraging note to let me know you're praying.
              </p>
            </div>

            {/* Add Prayer Form */}
            <div style={{
              backgroundColor: colors.warmWhite,
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '40px',
              boxShadow: '0 4px 20px rgba(92, 64, 51, 0.08)',
            }}>
              <h3 style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '1.2rem',
                color: colors.forestGreen,
                margin: '0 0 20px',
                textAlign: 'center',
              }}>✨ Add Your Prayer Commitment</h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px',
                marginBottom: '15px',
              }}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={newPrayerName}
                  onChange={(e) => setNewPrayerName(e.target.value)}
                  maxLength={50}
                  style={{
                    padding: '14px 18px',
                    border: `2px solid ${colors.softSand}`,
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontFamily: '"Source Sans 3", sans-serif',
                    backgroundColor: colors.cream,
                    transition: 'border-color 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.forestGreen}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.softSand}
                />
                
                <input
                  type="text"
                  placeholder="Leave an encouraging note (optional)"
                  value={newPrayerNote}
                  onChange={(e) => setNewPrayerNote(e.target.value)}
                  maxLength={200}
                  style={{
                    padding: '14px 18px',
                    border: `2px solid ${colors.softSand}`,
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontFamily: '"Source Sans 3", sans-serif',
                    backgroundColor: colors.cream,
                    transition: 'border-color 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.forestGreen}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.softSand}
                />
              </div>
              
              <button
                onClick={submitPrayerCommitment}
                disabled={!newPrayerName.trim() || isSubmittingPrayer}
                style={{
                  width: '100%',
                  padding: '14px 30px',
                  background: newPrayerName.trim() 
                    ? `linear-gradient(135deg, ${colors.forestGreen} 0%, ${colors.forestGreenLight} 100%)`
                    : colors.softSand,
                  border: 'none',
                  borderRadius: '50px',
                  fontFamily: '"Source Sans 3", sans-serif',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: newPrayerName.trim() ? colors.warmWhite : colors.earthBrown,
                  cursor: newPrayerName.trim() && !isSubmittingPrayer ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  opacity: isSubmittingPrayer ? 0.7 : 1,
                }}
                onMouseOver={(e) => {
                  if (newPrayerName.trim() && !isSubmittingPrayer) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${colors.forestGreen}30`;
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isSubmittingPrayer ? 'Adding to Wall...' : '🙏 I Commit to Pray'}
              </button>
              
              {/* Error Message */}
              {prayerError && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  backgroundColor: `${colors.terracotta}15`,
                  color: colors.terracotta,
                  fontSize: '0.95rem',
                  textAlign: 'center',
                  fontWeight: 500,
                }}>
                  {prayerError}
                </div>
              )}
            </div>

            {/* Prayer Wall Grid */}
            <div>
              <h3 style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '1.3rem',
                color: colors.forestGreen,
                margin: '0 0 25px',
                textAlign: 'center',
              }}>
                {prayerCommitments.length > 0 
                  ? `${prayerCommitments.length} Prayer Partner${prayerCommitments.length !== 1 ? 's' : ''} Standing With Me`
                  : 'Be the First to Commit'}
              </h3>
              
              {isLoadingPrayers ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: colors.earthBrown, opacity: 0.7 }}>Loading prayer wall...</p>
                </div>
              ) : prayerCommitments.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '50px 30px',
                  backgroundColor: colors.warmWhite,
                  borderRadius: '20px',
                  boxShadow: '0 4px 20px rgba(92, 64, 51, 0.08)',
                }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>🌱</span>
                  <p style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.2rem',
                    color: colors.forestGreen,
                    margin: '0 0 10px',
                  }}>This wall is waiting for you</p>
                  <p style={{ color: colors.earthBrown, margin: 0, opacity: 0.8 }}>
                    Be the first to commit to praying for this mission!
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px',
                }}>
                  {prayerCommitments.map((commitment, index) => (
                    <div
                      key={commitment.id}
                      style={{
                        backgroundColor: colors.warmWhite,
                        borderRadius: '16px',
                        padding: '22px',
                        boxShadow: '0 4px 15px rgba(92, 64, 51, 0.06)',
                        borderTop: `4px solid ${
                          index % 3 === 0 ? colors.terracotta : 
                          index % 3 === 1 ? colors.sunYellow : 
                          colors.forestGreen
                        }`,
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        cursor: 'default',
                        overflow: 'hidden',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(92, 64, 51, 0.12)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(92, 64, 51, 0.06)';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: commitment.note ? '12px' : 0,
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: `${
                            index % 3 === 0 ? colors.terracotta : 
                            index % 3 === 1 ? colors.sunYellow : 
                            colors.forestGreen
                          }20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          flexShrink: 0,
                        }}>
                          🙏
                        </div>
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                          <p style={{
                            fontWeight: 600,
                            color: colors.forestGreen,
                            fontSize: '1.05rem',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                          }}>
                            {commitment.name}
                          </p>
                          <p style={{
                            fontSize: '0.8rem',
                            color: colors.earthBrown,
                            opacity: 0.6,
                            margin: 0,
                          }}>
                            {commitment.date}
                          </p>
                        </div>
                      </div>
                      {commitment.note && (
                        <p style={{
                          margin: '12px 0 0 0',
                          fontSize: '0.95rem',
                          color: colors.earthBrown,
                          lineHeight: 1.6,
                          fontStyle: 'italic',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto',
                        }}>
                          "{commitment.note}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          backgroundColor: colors.forestGreen,
          color: colors.cream,
          padding: '60px 20px',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Decorative pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 10px, ${colors.cream} 10px, ${colors.cream} 11px),
              repeating-linear-gradient(-45deg, transparent, transparent 10px, ${colors.cream} 10px, ${colors.cream} 11px)
            `,
            pointerEvents: 'none',
          }} />
          
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            position: 'relative',
          }}>
            <blockquote style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
              fontStyle: 'italic',
              marginBottom: '20px',
              lineHeight: 1.7,
            }}>
              "The Lord God has told us what is right and what he demands: 'See that justice is done, let mercy be your first concern, and humbly obey your God.'"
            </blockquote>
            <p style={{
              fontSize: '0.95rem',
              opacity: 0.8,
              marginBottom: '35px',
            }}>— Micah 6:8 (CEV)</p>
            
            <a
              href="https://aletheia.ccbchurch.com/goto/forms/1043/responses/new"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '16px 40px',
                background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                border: 'none',
                borderRadius: '50px',
                fontFamily: '"Source Sans 3", sans-serif',
                fontSize: '1rem',
                fontWeight: 600,
                color: colors.warmWhite,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: `0 4px 20px ${colors.terracotta}40`,
                textDecoration: 'none',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 30px ${colors.terracotta}50`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 20px ${colors.terracotta}40`;
              }}
            >
              Give Now
            </a>
            
            {/* Social sharing */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '35px',
              marginBottom: '25px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Share this journey:</span>
              <button 
                onClick={() => handleShare('facebook')}
                style={{ 
                  background: 'none',
                  border: 'none',
                  color: colors.cream, 
                  textDecoration: 'none', 
                  opacity: 0.8, 
                  transition: 'opacity 0.3s',
                  cursor: 'pointer',
                  fontFamily: '"Source Sans 3", sans-serif',
                  fontSize: '1rem',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}>
                Facebook
              </button>
              <button 
                onClick={() => handleShare('twitter')}
                style={{ 
                  background: 'none',
                  border: 'none',
                  color: colors.cream, 
                  textDecoration: 'none', 
                  opacity: 0.8, 
                  transition: 'opacity 0.3s',
                  cursor: 'pointer',
                  fontFamily: '"Source Sans 3", sans-serif',
                  fontSize: '1rem',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}>
                Twitter
              </button>
              <button 
                onClick={() => handleShare('email')}
                style={{ 
                  background: 'none',
                  border: 'none',
                  color: colors.cream, 
                  textDecoration: 'none', 
                  opacity: 0.8, 
                  transition: 'opacity 0.3s',
                  cursor: 'pointer',
                  fontFamily: '"Source Sans 3", sans-serif',
                  fontSize: '1rem',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}>
                Email
              </button>
            </div>
            
            <a 
              href="mailto:emmanuella.m.f@gmail.com"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                opacity: 0.8,
                marginTop: '30px',
                color: colors.cream,
                textDecoration: 'none',
                transition: 'opacity 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = 1;
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = 0.8;
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              Questions? Reach out anytime.
            </a>

          </div>
        </footer>
      </div>
    </div>
  );
};

export default NicaraguaMissionDashboard;
