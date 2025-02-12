import { minify } from 'pgsql-minify';
import { _filtersToSQL as filtersToSQL } from '@carto/react-core';
import { executeSQL, SourceTypes } from '@carto/react-api';
import { Methods, executeTask } from '@carto/react-workers';

export const getHistogram = async (props) => {
  const {
    data,
    credentials,
    column,
    operation,
    ticks,
    filters,
    opts,
    viewportFilter,
    dataSource,
    type
  } = props;

  if (Array.isArray(data)) {
    throw new Error('Array is not a valid type to get histogram');
  }

  if (type === SourceTypes.BIGQUERY && !viewportFilter) {
    throw new Error(
      'Histogram Widget error: BigQuery layer needs "viewportFilter" prop set to true.'
    );
  }

  if (viewportFilter) {
    return executeTask(dataSource, Methods.VIEWPORT_FEATURES_HISTOGRAM, {
      filters,
      operation,
      column,
      ticks
    });
  }

  const operationColumn = props.operationColumn || column;
  const query = buildSqlQueryToGetHistogram({
    data,
    operationColumn,
    column,
    operation,
    ticks,
    filters
  });
  const queryResult = await executeSQL(credentials, query, opts);

  const result = [];
  for (let i = 0; i <= ticks.length; i++) {
    const tick = `cat_${i}`;
    const element = queryResult.find((d) => d.tick === tick);
    result.push(element ? element.value : null);
  }

  return result;
};

/**
 * Build a SQL sentence to get Histogram defined by props
 */
export const buildSqlQueryToGetHistogram = ({
  data,
  operationColumn,
  column,
  operation,
  ticks,
  filters
}) => {
  const caseTicks = ticks.map((t, index) => `WHEN ${column} < ${t} THEN 'cat_${index}'`);
  caseTicks.push(`ELSE 'cat_${ticks.length}'`);

  const query = `
    SELECT 
      tick, ${operation}(${operationColumn}) as value
    FROM 
      (
        SELECT 
          CASE ${caseTicks.join(' ')} END as tick, ${operationColumn} 
        FROM (
          SELECT 
            * 
          FROM (${data}) as q2
          ${filtersToSQL(filters)}
        ) as q1
      ) as q
    GROUP BY tick
  `;

  return minify(query);
};