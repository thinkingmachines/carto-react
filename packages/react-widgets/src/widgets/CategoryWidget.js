import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { addFilter, removeFilter, selectSourceById } from '@carto/react-redux';
import { WrapperWidgetUI, CategoryWidgetUI } from '@carto/react-ui';
import {
  _FilterTypes as FilterTypes,
  _getApplicableFilters as getApplicableFilters,
  AggregationTypes
} from '@carto/react-core';
import { getCategories } from '../models';
import useWidgetLoadingState from './useWidgetLoadingState';

/**
 * Renders a <CategoryWidget /> component
 * @param  props
 * @param  {string} props.id - ID for the widget instance.
 * @param  {string} props.title - Title to show in the widget header.
 * @param  {string} props.dataSource - ID of the data source to get the data from.
 * @param  {string} props.column - Name of the data source's column to get the data from.
 * @param  {string} [props.operationColumn] - Name of the data source's column to operate with. If not defined it will default to the one defined in `column`.
 * @param  {string} props.operation - Operation to apply to the operationColumn. Must be one of those defined in `AggregationTypes` object.
 * @param  {formatterCallback} [props.formatter] - Function to format each value returned.
 * @param  {Object} [props.labels] - Overwrite category labels
 * @param  {boolean} [props.viewportFilter=true] - Defines whether filter by the viewport or globally.
 * @param  {errorCallback} [props.onError] - Function to handle error messages from the widget.
 * @param  {Object} [props.wrapperProps] - Extra props to pass to [WrapperWidgetUI](https://storybook-react.carto.com/?path=/docs/widgets-wrapperwidgetui--default)
 */
function CategoryWidget(props) {
  const { column } = props;
  const [categoryData, setCategoryData] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const dispatch = useDispatch();
  const source = useSelector((state) => selectSourceById(state, props.dataSource) || {});
  const viewportFeaturesReady = useSelector((state) => state.carto.viewportFeaturesReady);
  const widgetsLoadingState = useSelector((state) => state.carto.widgetsLoadingState);
  const [hasLoadingState, setIsLoading] = useWidgetLoadingState(
    props.id,
    props.viewportFilter
  );
  const { data, credentials, type } = source;

  useEffect(() => {
    const abortController = new AbortController();
    if (data && credentials && hasLoadingState) {
      const filters = getApplicableFilters(source.filters, props.id);
      !props.viewportFilter && setIsLoading(true);
      getCategories({
        ...props,
        data,
        filters,
        credentials,
        viewportFeatures: viewportFeaturesReady[props.dataSource] || false,
        dataSource: props.dataSource,
        type,
        opts: { abortController }
      })
        .then((data) => setCategoryData(data))
        .catch((error) => {
          if (error.name === 'AbortError') return;
          if (props.onError) props.onError(error);
        })
        .finally(() => setIsLoading(false));
    } else {
      setCategoryData(null);
    }

    return function cleanup() {
      abortController.abort();
    };
  }, [
    credentials,
    data,
    setIsLoading,
    source.filters,
    type,
    viewportFeaturesReady,
    props,
    hasLoadingState
  ]);

  const handleSelectedCategoriesChange = useCallback(
    (categories) => {
      setSelectedCategories(categories);

      if (categories && categories.length) {
        dispatch(
          addFilter({
            id: props.dataSource,
            column,
            type: FilterTypes.IN,
            values: categories,
            owner: props.id
          })
        );
      } else {
        dispatch(
          removeFilter({
            id: props.dataSource,
            column
          })
        );
      }
    },
    [column, props.dataSource, props.id, setSelectedCategories, dispatch]
  );

  return (
    <WrapperWidgetUI
      title={props.title}
      isLoading={widgetsLoadingState[props.id]}
      {...props.wrapperProps}
    >
      <CategoryWidgetUI
        data={categoryData}
        formatter={props.formatter}
        labels={props.labels}
        isLoading={widgetsLoadingState[props.id]}
        selectedCategories={selectedCategories}
        onSelectedCategoriesChange={handleSelectedCategoriesChange}
      />
    </WrapperWidgetUI>
  );
}

CategoryWidget.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  dataSource: PropTypes.string.isRequired,
  column: PropTypes.string.isRequired,
  operationColumn: PropTypes.string,
  operation: PropTypes.oneOf(Object.values(AggregationTypes)).isRequired,
  formatter: PropTypes.func,
  labels: PropTypes.object,
  viewportFilter: PropTypes.bool,
  onError: PropTypes.func,
  wrapperProps: PropTypes.object
};

CategoryWidget.defaultProps = {
  labels: {},
  viewportFilter: true,
  wrapperProps: {}
};

export default CategoryWidget;
