import { useRef, useCallback } from 'react';

interface InkEditorProps {
  value: string;
  onChange: (value: string) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

/**
 * Renders Ink tags (# lines) as italic + semi-transparent
 * while keeping dialogue lines styled normally.
 * Uses a transparent textarea over a styled div — same pattern as CodeMirror.
 */
function highlight(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        // Escape HTML entities so the div renders safely
        const safe = trimmed.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<span class="ink-tag">${safe}</span>`;
      }
      const safe = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<span>${safe}</span>`;
    })
    .join('\n');
}

export function InkEditor({
  value,
  onChange,
  onKeyUp,
  onClick,
  placeholder,
  disabled,
  textareaRef: externalRef,
}: InkEditorProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const ref = externalRef ?? internalRef;

  const syncScroll = useCallback(() => {
    const ta = ref.current;
    const highlight = ta?.parentElement?.querySelector('.ink-highlight') as HTMLElement | null;
    if (ta && highlight) {
      highlight.scrollTop = ta.scrollTop;
    }
  }, [ref]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Styled highlight layer — sits behind the textarea */}
      <div
        className="ink-highlight book-editor"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: highlight(value) + '\n' }} // trailing \n prevents last-line collapse
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowY: 'auto',
          color: 'transparent', // we only want the spans to add colour
        }}
      />
      {/* Transparent textarea handles all input */}
      <textarea
        ref={ref}
        className="book-editor"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoFocus
        onChange={(e) => {
          onChange(e.target.value);
          syncScroll();
        }}
        onScroll={syncScroll}
        onKeyUp={onKeyUp}
        onClick={onClick}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'transparent',
          color: 'transparent',
          caretColor: 'var(--text-primary)',
          resize: 'none',
          zIndex: 1,
          opacity: disabled ? 0.3 : 1,
        }}
      />
    </div>
  );
}
