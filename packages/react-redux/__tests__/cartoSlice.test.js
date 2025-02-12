import * as cartoSlice from '../src/slices/cartoSlice';
import { mockAppStoreConfiguration } from './mockReducerManager';
import { VOYAGER } from '@carto/react-basemaps';

const INITIAL_STATE = {
  viewState: {
    latitude: 0,
    longitude: 0,
    zoom: 1,
    pitch: 0,
    bearing: 0,
    dragRotate: false
  }
};

describe('carto slice', () => {
  const store = mockAppStoreConfiguration();
  store.reducerManager.add('carto', cartoSlice.createCartoSlice(INITIAL_STATE));

  describe('source actions', () => {
    const sourceInfo = {
      id: 'source-test-id',
      data: 'SELECT * FROM stores',
      type: 'sql'
    };

    test('should add a new source', () => {
      store.dispatch(cartoSlice.addSource(sourceInfo));
      const { carto } = store.getState();
      expect(carto.dataSources[sourceInfo.id]).toEqual(sourceInfo);
    });

    test('should remove a source', () => {
      store.dispatch(cartoSlice.removeSource(sourceInfo.id));
      const { carto } = store.getState();
      expect(carto.dataSources).not.toHaveProperty(sourceInfo.id);
    });
  });

  describe('layer actions', () => {
    const layerInfo = {
      id: 'whatever-id',
      source: 'whatever-source-id'
    };

    const extraInfo = {
      id: layerInfo.id,
      layerAttributes: { a: 1 }
    };

    test('should not update a layer info if there is no layer', () => {
      store.dispatch(cartoSlice.updateLayer(extraInfo));
      const { carto } = store.getState();
      expect(carto.layers).not.toHaveProperty(layerInfo.id);
    });

    test('should add a new layer', () => {
      store.dispatch(cartoSlice.addLayer(layerInfo));
      const { carto } = store.getState();
      expect(carto.layers[layerInfo.id]).toEqual(layerInfo);
    });

    test('should update a layer with extra layerAttributes info', () => {
      store.dispatch(cartoSlice.updateLayer(extraInfo));
      const { carto } = store.getState();
      expect(carto.layers[layerInfo.id]).toEqual({
        ...layerInfo,
        ...extraInfo.layerAttributes
      });
    });

    test('should remove a layer', () => {
      store.dispatch(cartoSlice.removeLayer(layerInfo.id));
      const { carto } = store.getState();
      expect(carto.layers).not.toHaveProperty(layerInfo.id);
    });
  });

  describe('basemap actions', () => {
    test('should update with a new basemap', () => {
      store.dispatch(cartoSlice.setBasemap(VOYAGER));
      const { carto } = store.getState();
      expect(carto.basemap).toBe(VOYAGER);
    });
  });

  describe('view actions', () => {
    test('should update with a new viewState', () => {
      store.dispatch(cartoSlice.setViewState({ zoom: 3 }));
      const { carto } = store.getState();
      expect(carto.viewState.zoom).toBe(3);
    });
  });

  describe('filters actions', () => {
    const filter = {
      id: 'source-test-id-2',
      column: 'test-column',
      type: 'sql',
      values: [1, 2],
      owner: 'widgetId'
    };

    test('should not add a filter if there is no source', () => {
      store.dispatch(cartoSlice.addFilter(filter));
      const { carto } = store.getState();
      expect(carto.dataSources[filter.id]).toBe(undefined);
    });

    test('should add a filter', () => {
      store.dispatch(cartoSlice.addSource({ id: filter.id }));
      store.dispatch(cartoSlice.addFilter(filter));
      const { carto } = store.getState();
      expect(carto.dataSources[filter.id].filters[filter.column][filter.type]).toEqual({
        values: filter.values,
        owner: filter.owner
      });
    });

    test('should remove a filter', () => {
      store.dispatch(cartoSlice.removeFilter({ id: filter.id, column: filter.column }));
      const { carto } = store.getState();
      expect(carto.dataSources[filter.id].filters).not.toHaveProperty(filter.column);
    });

    test('should clear a filter', () => {
      const sourceId = 'source-test-id-3';
      store.dispatch(cartoSlice.addSource({ id: sourceId }));
      store.dispatch(cartoSlice.addFilter({ ...filter, id: sourceId }));
      store.dispatch(cartoSlice.clearFilters(sourceId));
      const { carto } = store.getState();
      expect(carto.dataSources[sourceId]).not.toHaveProperty('filters');
    });
  });

  describe('viewport features actions', () => {
    const featuresInfo = {
      sourceId: 'whatever-source-id',
      features: [{ a: 1 }]
    };

    test('should set features', () => {
      store.dispatch(cartoSlice.setViewportFeatures(featuresInfo));
      const { carto } = store.getState();
      expect(carto.viewportFeatures[featuresInfo.sourceId]).toEqual(
        featuresInfo.features
      );
    });

    test('should remove features by sourceId', () => {
      store.dispatch(cartoSlice.removeViewportFeatures(featuresInfo.sourceId));
      const { carto } = store.getState();
      expect(carto.viewportFeatures).not.toHaveProperty(featuresInfo.sourceId);
    });

    test('worker calculations should be finished', () => {
      const sourceInfo = {
        sourceId: 'whatever-source-id',
        ready: true
      };
      store.dispatch(cartoSlice.setViewportFeaturesReady(sourceInfo));
      const { carto } = store.getState();
      expect(carto.viewportFeaturesReady[sourceInfo.sourceId]).toBe(true);
    });
  });

  describe('widget loading actions', () => {
    const loadingInfo = {
      widgetId: 'whatever-id',
      isLoading: true
    };

    test('should set a widget loading state', () => {
      store.dispatch(cartoSlice.setWidgetLoadingState(loadingInfo));
      const { carto } = store.getState();
      expect(carto.widgetsLoadingState[loadingInfo.widgetId]).toBe(loadingInfo.isLoading);
    });

    test('should remove a widget loading state by sourceId', () => {
      store.dispatch(cartoSlice.removeWidgetLoadingState(loadingInfo.widgetId));
      const { carto } = store.getState();
      expect(carto.widgetsLoadingState).not.toHaveProperty(loadingInfo.widgetId);
    });

    test('should set all widget loading states', () => {
      store.dispatch(cartoSlice.setAllWidgetsLoadingState(false));
      const { carto } = store.getState();
      for (const state of Object.values(carto.widgetsLoadingState)) {
        expect(state).toBe(false);
      }
    });
  });
});
