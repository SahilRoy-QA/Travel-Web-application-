import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Ensures that whenever the user clicks any link, navigates to a new page,
 * or triggers a page view action, the viewport reliably and instantly focuses
 * on the top of the page (0, 0), preventing any unexpected drop down to the footer.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search, hash } = useLocation();

  const resetToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' as ScrollBehavior,
      });

      if (typeof document !== 'undefined') {
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
        const root = document.getElementById('root');
        if (root) root.scrollTop = 0;
        const main = document.querySelector('main');
        if (main) main.scrollTop = 0;
      }
    } catch {
      // Fallback
    }
  };

  // 1. Immediately reset to top on route change
  useEffect(() => {
    if (!hash) {
      resetToTop();
      // Reinforce across animation frames to counteract delayed dynamic content mounting
      const af1 = requestAnimationFrame(resetToTop);
      const timer1 = setTimeout(resetToTop, 40);
      const timer2 = setTimeout(resetToTop, 120);

      return () => {
        cancelAnimationFrame(af1);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [pathname, search, hash]);

  // 2. Global click interceptor for navigation links & actions
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLinkOrButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const link = target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        // If clicking a link to another page or route (not an on-page hash jump #)
        if (!href || (!href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:'))) {
          resetToTop();
          setTimeout(resetToTop, 20);
        }
      }
    };

    window.addEventListener('click', handleLinkOrButtonClick, { capture: true });
    return () => window.removeEventListener('click', handleLinkOrButtonClick, { capture: true });
  }, []);

  return null;
};
