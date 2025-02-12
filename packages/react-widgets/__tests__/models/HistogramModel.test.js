import { minify } from 'pgsql-minify';

import {
  getHistogram,
  buildSqlQueryToGetHistogram
} from '../../src/models/HistogramModel';
import { AggregationTypes } from '@carto/react-core';
import { SourceTypes } from '@carto/react-api';
import { Methods, executeTask } from '@carto/react-workers';
import { mockSqlApiRequest, mockClear } from '../mockSqlApiRequest';

jest.mock('@carto/react-workers', () => ({
  executeTask: jest.fn(),
  Methods: {
    VIEWPORT_FEATURES_HISTOGRAM: 'viewportFeaturesHistogram'
  }
}));

describe('getHistogram', () => {
  test('should throw with array data', async () => {
    await expect(getHistogram({ data: [] })).rejects.toThrow(
      'Array is not a valid type to get histogram'
    );
  });

  test('should throw if using CartoBQTilerLayer without viewportFilter', async () => {
    await expect(
      getHistogram({ type: SourceTypes.BIGQUERY, viewportFilter: false })
    ).rejects.toThrow(
      'Histogram Widget error: BigQuery layer needs "viewportFilter" prop set to true.'
    );
  });

  describe('SQL Layer', () => {
    describe('should execute a SqlApi request when using "viewportFilter": false', () => {
      const response = {
        rows: [
          { tick: 'cat_3', value: 1495728 },
          { tick: 'cat_2', value: 1471841 },
          { tick: 'cat_1', value: 1326625 },
          { tick: 'cat_0', value: 1317791 }
        ]
      };
      const sql = 'SELECT revenue FROM retail_stores LIMIT 4';
      const credentials = {
        username: 'public',
        apiKey: 'default_public',
        serverUrlTemplate: 'https://{user}.carto.com'
      };
      const queryResult = [
        { tick: 'cat_3', value: 1495728 },
        { tick: 'cat_2', value: 1471841 },
        { tick: 'cat_1', value: 1326625 },
        { tick: 'cat_0', value: 1317791 }
      ];

      mockSqlApiRequest({ response, sql, credentials });

      beforeEach(() => {
        mockClear();
      });

      test('should call SqlApi', async () => {
        const params = {
          data: sql,
          credentials,
          operation: 'count',
          column: 'revenue',
          operationColumn: 'revenue',
          type: SourceTypes.SQL,
          ticks: [1300000, 1400000, 1500000],
          viewportFilter: false
        };
        const histogram = await getHistogram(params);

        function findTicksInQueryResult(ticks, queryResult) {
          const result = [];
          for (let i = 0; i <= ticks.length; i++) {
            const tick = `cat_${i}`;
            const element = queryResult.find((d) => d.tick === tick);
            result.push(element ? element.value : null);
          }
          return result;
        }

        const makeTicks = findTicksInQueryResult(params.ticks, queryResult);
        expect(histogram).toEqual(makeTicks);
      });
    });

    describe('should handle viewport features - "viewportFilter" prop is true', () => {
      // prettier-ignore
      const viewportFeatures = [{ revenue: 0 }, { revenue: 1 }, { revenue: 2 }, { revenue: 3 }];

      const histogramParams = {
        operation: AggregationTypes.COUNT,
        column: 'revenue',
        type: SourceTypes.SQL,
        ticks: [0, 1, 2],
        viewportFilter: true,
        viewportFeatures
      };

      test('correctly returns data', async () => {
        executeTask.mockImplementation(() => Promise.resolve([0, 1, 2, 1]));
        const histogram = await getHistogram(histogramParams);
        expect(histogram).toEqual([0, 1, 2, 1]);
      });

      test('correctly called', async () => {
        const { column, dataSource, filters, operation, ticks } = histogramParams;
        await getHistogram(histogramParams);
        expect(executeTask).toHaveBeenCalledWith(
          dataSource,
          Methods.VIEWPORT_FEATURES_HISTOGRAM,
          { column, filters, operation, ticks }
        );
      });
    });
  });
});

describe('buildSqlQueryToGetHistogram', () => {
  const buildParamsFor = (operation) => ({
    data: 'SELECT storetype, revenue FROM retail_stores',
    operation,
    column: 'revenue',
    operationColumn: 'revenue',
    ticks: [1200000, 1300000, 1400000, 1500000, 1600000, 1700000, 1800000]
  });

  const buildQuery = (params) => `
    SELECT
      tick, ${params.operation}(${params.operationColumn}) as value
    FROM
      (
        SELECT
          CASE WHEN revenue < 1200000 THEN 'cat_0' WHEN revenue < 1300000 THEN 'cat_1' WHEN revenue < 1400000 THEN 'cat_2' WHEN revenue < 1500000 THEN 'cat_3' WHEN revenue < 1600000 THEN 'cat_4' WHEN revenue < 1700000 THEN 'cat_5' WHEN revenue < 1800000 THEN 'cat_6' ELSE 'cat_7' END as tick, ${params.operationColumn}
        FROM (
          SELECT
            *
          FROM (${params.data}) as q2
        ) as q1
      ) as q
    GROUP BY tick
  `;

  test(AggregationTypes.COUNT, () => {
    const params = buildParamsFor(AggregationTypes.COUNT);
    const query = buildQuery(params);
    expect(buildSqlQueryToGetHistogram(params)).toEqual(minify(query));
  });

  test(AggregationTypes.AVG, () => {
    const params = buildParamsFor(AggregationTypes.AVG);
    const query = buildQuery(params);
    expect(buildSqlQueryToGetHistogram(params)).toEqual(minify(query));
  });

  test(AggregationTypes.SUM, () => {
    const params = buildParamsFor(AggregationTypes.SUM);
    const query = buildQuery(params);
    expect(buildSqlQueryToGetHistogram(params)).toEqual(minify(query));
  });

  test(AggregationTypes.MIN, () => {
    const params = buildParamsFor(AggregationTypes.MIN);
    const query = buildQuery(params);
    expect(buildSqlQueryToGetHistogram(params)).toEqual(minify(query));
  });

  test(AggregationTypes.MAX, () => {
    const params = buildParamsFor(AggregationTypes.MAX);
    const query = buildQuery(params);
    expect(buildSqlQueryToGetHistogram(params)).toEqual(minify(query));
  });
});
