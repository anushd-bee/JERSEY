/**
 * useScrollReveal
 *
 * Attaches an IntersectionObserver to elements that have the
 * `.reveal` or `.stagger-children` CSS class.
 * When an element enters the viewport it receives `.is-visible`,
 * triggering the CSS transition defined in globals.css.
 *
 * Usage (attach to a container ref, or pass `document` to observe globally):
 *
 *   const sectionRef = useRef(null);
 *   useScrollReveal(sectionRef);
 *
 * Or use the global hook in a layout component (no ref needed):
 *
 *   useScrollReveal();     // observes the whole document
 */

import { useEffect } from 'react';

const OBSERVE_CLASSES = ['.reveal', '.stagger-children'];

export function useScrollReveal(containerRef = null, options = {}) {
    useEffect(() => {
        const {
            threshold = 0.12,
            rootMargin = '0px 0px -48px 0px',
            once = true,
        } = options;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        if (once) {
                            observer.unobserve(entry.target);
                        }
                    } else if (!once) {
                        entry.target.classList.remove('is-visible');
                    }
                });
            },
            { threshold, rootMargin }
        );

        const container = containerRef
            ? containerRef.current
            : document;

        if (!container) return;

        const selector = OBSERVE_CLASSES.join(', ');
        const elements = container.querySelectorAll
            ? container.querySelectorAll(selector)
            : document.querySelectorAll(selector);

        elements.forEach((el) => observer.observe(el));

        // If elements are added dynamically after mount, this MutationObserver
        // re-scans and starts observing new ones.
        const mutationObs = new MutationObserver(() => {
            const fresh = (containerRef?.current || document).querySelectorAll(selector);
            fresh.forEach((el) => {
                if (!el.classList.contains('is-visible')) {
                    observer.observe(el);
                }
            });
        });

        const root = containerRef?.current || document.body;
        if (root) {
            mutationObs.observe(root, { childList: true, subtree: true });
        }

        return () => {
            observer.disconnect();
            mutationObs.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

export default useScrollReveal;
