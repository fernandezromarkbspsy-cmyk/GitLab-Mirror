import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
export function Reveal({ children, delay = 0, className = '' }) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setInView(true);
                io.disconnect();
            }
        }, { threshold: 0.12 });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return (_jsx("div", { ref: ref, className: `reveal ${inView ? 'is-in' : ''} ${className}`, style: { transitionDelay: `${delay}ms` }, children: children }));
}
