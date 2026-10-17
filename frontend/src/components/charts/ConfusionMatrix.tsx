interface ConfusionMatrixProps {
  matrix: number[][]; // [[TN, FP], [FN, TP]]
}

function intensity(value: number, max: number): string {
  const ratio = max > 0 ? value / max : 0;
  // TN: blue scale, TP: green scale, FP/FN: red scale
  return `rgba(59, 130, 246, ${0.1 + ratio * 0.55})`;
}

export default function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  if (!matrix || matrix.length < 2) return null;

  const [[TN, FP], [FN, TP]] = matrix;
  const total = TN + FP + FN + TP;

  const cells = [
    { label: 'TN', value: TN, sublabel: 'True Negative',  bg: `rgba(16, 185, 129, ${0.08 + (TN / total) * 0.3})`, color: 'var(--color-success)' },
    { label: 'FP', value: FP, sublabel: 'False Positive', bg: `rgba(220, 38, 38,  ${0.08 + (FP / total) * 0.8})`,  color: 'var(--color-destructive)' },
    { label: 'FN', value: FN, sublabel: 'False Negative', bg: `rgba(220, 38, 38,  ${0.08 + (FN / total) * 0.8})`,  color: 'var(--color-destructive)' },
    { label: 'TP', value: TP, sublabel: 'True Positive',  bg: `rgba(16, 185, 129, ${0.08 + (TP / total) * 0.6})`, color: 'var(--color-success)' },
  ];

  return (
    <div>
      {/* Axis labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gridTemplateRows: 'auto 1fr 1fr', gap: 6, maxWidth: 280, margin: '0 auto', fontFamily: 'var(--font-mono)' }}>
        {/* Corner */}
        <div />
        {/* Column headers */}
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-muted-foreground)', paddingBottom: 4 }}>Predicted 0</div>
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-muted-foreground)', paddingBottom: 4 }}>Predicted 1</div>

        {/* Row 1 */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 10, color: 'var(--color-muted-foreground)', paddingRight: 6, writingMode: 'vertical-lr', transform: 'rotate(180deg)', textAlign: 'center' }}>Actual 0</div>
        <div className="cm-cell" style={{ background: cells[0].bg, borderRadius: 8 }} role="gridcell" aria-label={`${cells[0].sublabel}: ${cells[0].value.toLocaleString()}`}>
          <span className="cm-cell-value" style={{ color: cells[0].color }}>{cells[0].value.toLocaleString()}</span>
          <span className="cm-cell-sublabel" style={{ color: cells[0].color }}>{cells[0].label}</span>
        </div>
        <div className="cm-cell" style={{ background: cells[1].bg, borderRadius: 8 }} role="gridcell" aria-label={`${cells[1].sublabel}: ${cells[1].value.toLocaleString()}`}>
          <span className="cm-cell-value" style={{ color: cells[1].color }}>{cells[1].value.toLocaleString()}</span>
          <span className="cm-cell-sublabel" style={{ color: cells[1].color }}>{cells[1].label}</span>
        </div>

        {/* Row 2 */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 10, color: 'var(--color-muted-foreground)', paddingRight: 6, writingMode: 'vertical-lr', transform: 'rotate(180deg)', textAlign: 'center' }}>Actual 1</div>
        <div className="cm-cell" style={{ background: cells[2].bg, borderRadius: 8 }} role="gridcell" aria-label={`${cells[2].sublabel}: ${cells[2].value.toLocaleString()}`}>
          <span className="cm-cell-value" style={{ color: cells[2].color }}>{cells[2].value.toLocaleString()}</span>
          <span className="cm-cell-sublabel" style={{ color: cells[2].color }}>{cells[2].label}</span>
        </div>
        <div className="cm-cell" style={{ background: cells[3].bg, borderRadius: 8 }} role="gridcell" aria-label={`${cells[3].sublabel}: ${cells[3].value.toLocaleString()}`}>
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
