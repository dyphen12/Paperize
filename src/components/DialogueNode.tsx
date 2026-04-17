import { Handle, Position, NodeResizer } from '@xyflow/react';

interface DialogueNodeProps {
  data: {
    label: string;
    text: string;
  };
  selected: boolean;
}

export function DialogueNode({ data, selected }: DialogueNodeProps) {
  const text = (data.text || '').trim();
  const lines = text.split('\n').slice(0, 6); // show up to 6 lines on canvas

  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`} style={{ height: '100%', minHeight: 80 }}>
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={80}
        lineStyle={{ stroke: 'var(--accent-color)', strokeWidth: 1 }}
        handleStyle={{ background: 'var(--accent-color)', border: 'none', width: 8, height: 8, borderRadius: 2 }}
      />
      <Handle type="target" position={Position.Top} className="node-handle" />
      <div className="custom-node-header">{data.label || 'Knot'}</div>
      <div className="custom-node-content" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {lines.length > 0 && text.length > 0 ? (
          lines.map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('#')) {
              return <div key={i} style={{ fontStyle: 'italic', opacity: 0.5, fontSize: '0.85em' }}>{trimmed}</div>;
            }
            return <div key={i}>{trimmed || '\u00A0'}</div>;
          })
        ) : (
          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Empty...</span>
        )}
        {text.split('\n').length > 6 && <div style={{ opacity: 0.4 }}>...</div>}
      </div>
      <Handle type="source" position={Position.Bottom} className="node-handle" />
    </div>
  );
}
