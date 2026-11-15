export function SparkleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 2.25c.32 0 .61.2.71.5l1.83 5.2 5.2 1.83a.75.75 0 0 1 0 1.42l-5.2 1.83-1.83 5.2a.75.75 0 0 1-1.42 0l-1.83-5.2-5.2-1.83a.75.75 0 0 1 0-1.42l5.2-1.83 1.83-5.2c.1-.3.39-.5.71-.5Z" />
      <path d="M19.25 16.5c.2 0 .39.13.46.32l.72 1.99 1.99.72a.5.5 0 0 1 0 .94l-1.99.72-.72 1.99a.5.5 0 0 1-.94 0l-.72-1.99-1.99-.72a.5.5 0 0 1 0-.94l1.99-.72.72-1.99a.5.5 0 0 1 .48-.32Z" transform="translate(-1 -1) scale(.9)" />
    </svg>
  );
}
