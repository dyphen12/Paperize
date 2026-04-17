import { Handle, Position, NodeResizer } from '@xyflow/react';

interface ChoiceNodeProps {
  data: {
    label: string;
    text: string;
    isSticky?: boolean;
    isFallback?: boolean;
  };
  selected: boolean;
}

export function ChoiceNode({ data, selected }: ChoiceNodeProps) {
  const symbol = data.isSticky ? '+' : '*';
  const prompt = (!data.label || data.label === 'Choice') ? null : data.label;
  const bodyText = (data.text || '').trim();
  const bodyPreview = bodyText.length > 80 ? `${bodyText.substring(0, 80)}...` : bodyText;

  return (
    <div className={`custom-node choice-node ${selected ? 'selected' : ''}`} style={{ height: '100%', minHeight: 70 }}>
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={70}
        lineStyle={{ stroke: 'var(--accent-color)', strokeWidth: 1, strokeDasharray: '4' }}
        handleStyle={{ background: 'var(--accent-color)', border: 'none', width: 7, height: 7, borderRadius: 50 }}
      />
      <Handle type="target" position={Position.Top} className="node-handle" />
      <div className="custom-node-header" style={{ color: 'var(--accent-color)' }}>
        {prompt ? `${symbol} [${prompt}]` : `${symbol} Choice Node`}
      </div>
      <div className="custom-node-content">
        {data.isFallback ? (
          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{symbol} {'→'} auto-divert</span>
        ) : bodyPreview ? (
          bodyText.split('\n').slice(0, 4).map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('#')) {
              return <div key={i} style={{ fontStyle: 'italic', opacity: 0.5, fontSize: '0.85em', color: 'var(--text-secondary)' }}>{trimmed}</div>;
            }
            return <div key={i} style={{ color: 'var(--text-secondary)' }}>{trimmed || '\u00A0'}</div>;
          })
        ) : (
          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Response dialogue...</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="node-handle" />
    </div>
  );
}
