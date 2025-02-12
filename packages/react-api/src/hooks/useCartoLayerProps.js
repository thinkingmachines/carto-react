import { DataFilterExtension } from '@deck.gl/extensions';
import { debounce, _buildFeatureFilter } from '@carto/react-core';
import useViewportFeatures from './useViewportFeatures';

export default function useCartoLayerProps(source, uniqueIdProperty) {
  const [onViewportLoad] = useViewportFeatures(source, uniqueIdProperty);

  return {
    binary: true,
    uniqueIdProperty,
    onViewportLoad: debounce(onViewportLoad),
    getFilterValue: _buildFeatureFilter({ filters: source?.filters, type: 'number' }),
    filterRange: [1, 1],
    extensions: [new DataFilterExtension({ filterSize: 1 })],
    updateTriggers: {
      getFilterValue: source?.filters
    }
  };
}
