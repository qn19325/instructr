'use client';

import { useEffect, useRef, useState } from 'react';

import type { ReactNode} from 'react';

interface ModalProps {
  title: string;
  trigger: (open: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
}

export default function Modal({ title, trigger, children }: ModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const elems = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    const first = elems[0];
    const last = elems[elems.length - 1];

    first?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    panel.addEventListener('keydown', handler);
    return () => panel.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <>
      {trigger(open)}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal={true}
            aria-labelledby="modal-title"
            ref={panelRef}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6"
          >
            <h2 id="modal-title" className="mb-5 text-base font-semibold text-slate-900">
              {title}
            </h2>
            {children(close)}
          </div>
        </div>
      )}
    </>
  );
}
