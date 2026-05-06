import { useEffect, useRef, useState } from 'react';
import { useDialogStore } from '../../store/dialogStore';
import styles from './Dialog.module.css';

export function DialogHost() {
  const request = useDialogStore((s) => s.request);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (request?.kind === 'prompt') {
      setValue(request.defaultValue ?? '');
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (request.kind === 'prompt') request.resolve(null);
        else if (request.kind === 'confirm') request.resolve(false);
        else request.resolve();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [request]);

  if (!request) return null;

  const cancel = () => {
    if (request.kind === 'prompt') request.resolve(null);
    else if (request.kind === 'confirm') request.resolve(false);
    else request.resolve();
  };

  const accept = () => {
    if (request.kind === 'prompt') request.resolve(value.trim() || null);
    else if (request.kind === 'confirm') request.resolve(true);
    else request.resolve();
  };

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) cancel();
  };

  const isDestructive =
    request.kind === 'confirm' && request.destructive === true;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={request.title}
      onMouseDown={onBackdropClick}
    >
      <div className={styles.dialog}>
        <div className={styles.title}>{request.title}</div>
        {request.description && (
          <div className={styles.description}>{request.description}</div>
        )}
        {request.kind === 'alert' && request.message && (
          <div className={styles.description}>{request.message}</div>
        )}

        {request.kind === 'prompt' && (
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            value={value}
            placeholder={request.placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                accept();
              }
            }}
          />
        )}

        <div className={styles.actions}>
          {(request.kind === 'prompt' || request.kind === 'confirm') && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={cancel}
            >
              {request.cancelLabel ?? 'Cancel'}
            </button>
          )}
          <button
            type="button"
            className={`${styles.btn} ${
              isDestructive ? styles.btnDestructive : styles.btnPrimary
            }`}
            onClick={accept}
          >
            {request.confirmLabel ??
              (request.kind === 'confirm' ? 'Confirm' : 'OK')}
          </button>
        </div>
      </div>
    </div>
  );
}
