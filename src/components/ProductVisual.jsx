import KeyboardPreview from './KeyboardPreview.jsx';
import { SwitchVisual, BoardVisual, StabVisual } from './PartVisuals.jsx';

const NEUTRAL_CASE = '#3f3f46';

/** Elige la ilustración adecuada según la categoría del producto. */
export default function ProductVisual({ product, legends = false, className = 'h-full w-full' }) {
  const v = product.visual ?? {};
  switch (product.category) {
    case 'keyboards':
      return <KeyboardPreview layout={product.layout} caseColor={v.case} colors={v} legends={legends} className={className} title={product.name} />;
    case 'cases':
      return <KeyboardPreview layout={product.layout} caseColor={v.case} blank className={className} title={product.name} />;
    case 'keycaps': {
      const layout = product.compat?.includes('65%') ? '65%' : product.compat?.[0];
      return <KeyboardPreview layout={layout} caseColor={NEUTRAL_CASE} colors={v} legends={legends} className={className} title={product.name} />;
    }
    case 'switches':
      return <SwitchVisual {...v} className={className} />;
    case 'plates':
      return <BoardVisual layout={product.layout} color={v.color} className={className} />;
    case 'pcbs':
      return <BoardVisual layout={product.layout} color={v.color} type="pcb" className={className} />;
    case 'stabilizers':
      return <StabVisual {...v} className={className} />;
    default:
      return null;
  }
}

// Las piezas pequeñas se ven mejor con más margen alrededor
export const visualPadding = (category) =>
  ({ switches: 'p-8 sm:p-10', stabilizers: 'p-8 sm:p-10' })[category] ?? 'p-4 sm:p-5';
