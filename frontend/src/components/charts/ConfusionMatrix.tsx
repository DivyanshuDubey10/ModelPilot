interface ConfusionMatrixProps {
  matrix: number[][]; // [[TN, FP], [FN, TP]]
}

export default function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  if (!matrix || matrix.length < 2) return null;

  const [[TN, FP], [FN, TP]] = matrix;

  const cells = [
    { label: 'TN', value: TN, sublabel: 'True Negative',  bg: 'rgba(22, 163, 74, 0.08)',  border: '1px solid rgba(22, 163, 74, 0.2)',   color: 'var(--color-success)' },
    { label: 'FP', value: FP, sublabel: 'False Positive', bg: 'rgba(220, 38, 38, 0.08)',  border: '1px solid rgba(220, 38, 38, 0.2)',  color: 'var(--color-destructive)' },
    { label: 'FN', value: FN, sublabel: 'False Negative', bg: 'rgba(220, 38, 38, 0.08)',  border: '1px solid rgba(220, 38, 38, 0.2)',  color: 'var(--color-destructive)' },
    { label: 'TP', value: TP, sublabel: 'True Positive',  bg: 'rgba(22, 163, 74, 0.12)',  border: '1px solid rgba(22, 163, 74, 0.25)',  color: 'var(--color-success)' },
  ];

  return (
    <div>
      {/* Axis labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gridTemplateRows: 'auto 1fr 1fr', gap: 6, maxWidth: 280, margin: '0 auto', fontFamily: 'var(--font-mono)' }}>
        {/* Corner */}
        <div />
        {/* Column headers */}
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-text-muted)', paddingBottom: 4 }}>Predicted 0</div>
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-text-muted)', paddingBottom: 4 }}>Predicted 1</div>

        {/* Row 1 */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 10, color: 'var(--color-text-muted)', paddingRight: 6, writingMode: 'vertical-lr', transform: 'rotate(180deg)', textAlign: 'center' }}>Actual 0</div>
        <div className="cm-cell" style={{ background: cells[0].bg, border: cells[0].border, borderRadius: 8 }} role="gridcell" aria-label={`${cells[0].sublabel}: ${cells[0].value.toLocaleString()}`}>
          <span className="cm-cell-value" style={{ color: cells[0].color }}>{cells[0].value.toLocaleString()}</span>
          <span className="cm-cell-sublabel" style={{ color: cells[0].color }}>{cells[0].label}</span>
        </div>
        <div className="cm-cell" style={{ background: cells[1].bg, border: cells[1].border, borderRadius: 8 }} role="gridcell" aria-label={`${cells[1].sublabel}: ${cells[1].value.toLocaleString()}`}>
          <span className="cm-cell-value" style={{ color: cells[1].color }}>{cells[1].value.toLocaleString()}</span>
          <span className="cm-cell-sublabel" style={{ color: cells[1].color }}>{cells[1].label}</span>
        </div>

        {/* Row 2 */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 10, color: 'var(--color-text-muted)', paddingRight: 6, writingMode: 'vertical-lr', transform: 'rotate(180deg)', textAlign: 'center' }}>Actual 1</div>
        <div className="cm-cell" style={{ background: cells[2].bg, border: cells[2].border, borderRadius: 8 }} role="gridcell" aria-label={`${cells[2].sublabel}: ${cells[2].value.toLocaleString()}`}>
          <span className="cm-cell-value" style={{ color: cells[2].color }}>{cells[2].value.toLocaleString()}</span>
          <span className="cm-cell-sublabel" style={{ color: cells[2].color }}>{cells[2].label}</span>
        </div>
        <div className="cm-cell" style={{ background: cells[3].bg, border: cells[3].border, borderRadius: 8 }} role="gridcell" aria-label={`${cells[3].sublabel}: ${cells[3].value.toLocaleString()}`}>
          <span className="cm-cell-value" style={{ color: cells[3].color }}>{cells[3].value.toLocaleString()}</span>
          <span className="cm-cell-sublabel" style={{ color: cells[3].color }}>{cells[3].label}</span>
        </div>
      </div>

      {/* Summary below matrix */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2xl)', marginTop: 'var(--space-lg)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
        <span style={{ color: 'var(--color-success)' }}>TP: {TP} · TN: {TN.toLocaleString()}</span>
        <span style={{ color: 'var(--color-destructive)' }}>FP: {FP} · FN: {FN}</span>
      </div>
    </div>
  );
}
