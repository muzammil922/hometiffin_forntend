import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToHashElement() {
  const { pathname, hash } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (hash) {
      // If we changed pages (e.g. from /menu → /), wait longer for the new page DOM to mount
      const crossPage = prevPathname.current !== pathname;
      const delay = crossPage ? 350 : 120;

      const timer = setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          // Offset for sticky navbar (approx 72px)
          const navbarHeight = 72;
          const top = element.getBoundingClientRect().top + window.scrollY - navbarHeight;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, delay);

      prevPathname.current = pathname;
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      prevPathname.current = pathname;
    }
  }, [pathname, hash]);

  return null;
}
