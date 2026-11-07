/* ============================================
   REVIERE EVENTS — LUXURY EVENT PLANNING & MANAGEMENT
   Founder & Lead Director: Manish Kumar
   Shared JavaScript & Interactions (Production Ready)
   ============================================ */

// === Global Site Configuration ===
// Update your contact details here once, and it reflects everywhere on the website.
window.SITE_CONFIG = {
  brandName: 'Reviere Events',
  ownerName: 'Manish Kumar',
  whatsappPhone: '918893535829', // Main number & WhatsApp (Country code 91 + 10 digits)
  mainPhoneFormatted: '+91 88935 35829',
  altPhone: '7762908507',
  altPhoneFormatted: '+91 77629 08507',
  email: 'reviereevent@gmail.com',
  instagramUrl: 'https://instagram.com/reviereevent',
  facebookUrl: 'https://facebook.com/Reviere-Events',
  defaultMessage: 'Hi Manish! I visited Reviere Events website and would like to inquire about Event Planning & Management services.'
};

// === WhatsApp Helper Function ===
window.openWhatsApp = function(message, event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  const rawPhone = window.SITE_CONFIG?.whatsappPhone || '918893535829';
  const cleanPhone = String(rawPhone).replace(/[^\d]/g, '');
  const finalMsg = message || window.SITE_CONFIG?.defaultMessage || 'Hi Manish! I would like to inquire about Reviere Events services.';
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMsg)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

document.addEventListener('DOMContentLoaded', () => {
  // === Navbar Scroll Effect ===
  const navbar = document.querySelector('.navbar');
  const isHomePage = document.querySelector('.hero');

  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else if (isHomePage) {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // === Mobile Drawer Navigation ===
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileOverlay = document.getElementById('mobileOverlay');

  if (mobileToggle && mobileDrawer && mobileOverlay) {
    mobileToggle.setAttribute('aria-expanded', 'false');

    const toggleMenu = () => {
      const isOpen = mobileDrawer.classList.contains('active');
      mobileToggle.classList.toggle('active', !isOpen);
      mobileDrawer.classList.toggle('active', !isOpen);
      mobileOverlay.classList.toggle('active', !isOpen);
      mobileToggle.setAttribute('aria-expanded', String(!isOpen));
      document.body.style.overflow = !isOpen ? 'hidden' : '';
    };

    const closeMenu = () => {
      mobileToggle.classList.remove('active');
      mobileDrawer.classList.remove('active');
      mobileOverlay.classList.remove('active');
      mobileToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    mobileToggle.addEventListener('click', toggleMenu);
    mobileOverlay.addEventListener('click', closeMenu);

    mobileDrawer.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // === Active Nav Link Highlight based on current URL path ===
  const currentPath = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
  const allNavLinks = document.querySelectorAll('.nav-link');
  
  allNavLinks.forEach(link => {
    link.classList.remove('active');
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href === currentPath || ((currentPath === '' || currentPath === '/') && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // === Scroll Animations (Intersection Observer) ===
  const animatedElements = document.querySelectorAll('.animate-on-scroll');

  if (animatedElements.length) {
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          entry.target.classList.add('visible');
          animObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.08
    });

    animatedElements.forEach(el => animObserver.observe(el));
  }

  // === Animated Number Counters ===
  const counters = document.querySelectorAll('.counter');

  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    counters.forEach(counter => counterObserver.observe(counter));
  }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 2200;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  // === Date Picker Constraint (Disable past dates) ===
  const dateInput = document.getElementById('eventDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  // === Contact Form Submission → WhatsApp ===
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = this.querySelector('[name="name"]')?.value.trim() || '';
      const phone = this.querySelector('[name="phone"]')?.value.trim() || '';
      const eventType = this.querySelector('[name="eventType"]')?.value || this.querySelector('[name="service"]')?.value || '';
      const eventDate = this.querySelector('[name="eventDate"]')?.value || '';
      const message = this.querySelector('[name="message"]')?.value.trim() || '';

      let whatsappMsg = `Hi Manish! I would like to inquire about Reviere Events planning services.\n\n`;
      whatsappMsg += `• Name: ${name}\n`;
      whatsappMsg += `• Phone: ${phone}\n`;
      if (eventType) whatsappMsg += `• Event Type: ${eventType}\n`;
      if (eventDate) whatsappMsg += `• Tentative Date: ${eventDate}\n`;
      if (message) whatsappMsg += `• Details: ${message}`;

      // Show temporary status feedback
      let statusMsg = document.getElementById('formStatusMsg');
      if (!statusMsg) {
        statusMsg = document.createElement('div');
        statusMsg.id = 'formStatusMsg';
        statusMsg.className = 'form-status-msg success';
        contactForm.appendChild(statusMsg);
      }
      statusMsg.innerHTML = '<i class="ri-whatsapp-line"></i> Opening WhatsApp with your inquiry...';
      statusMsg.style.display = 'flex';

      setTimeout(() => {
        window.openWhatsApp(whatsappMsg);
      }, 300);
    });
  }
});
