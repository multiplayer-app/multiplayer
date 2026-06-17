import { IListRes } from "shared/models/interfaces";

/**
 * Fetches paginated data by making recursive calls to a provided fetching function.
 * @param {Function} fetchFn - The fetching function to be called for retrieving data.
 * @param {Object} params - The parameters to be passed to the fetching function.
 * @param {number} [page=0] - The current page number (default: 0).
 * @param {number} [limit=10] - The number of items per page (default: 10).
 * @returns {Promise<Array>} - A Promise that resolves to an array of retrieved data.
 */
export const fetchAllData = async <T>(
  fetchFn: (params: any) => Promise<IListRes<T>>,
  params: any = {},
  page: number = 0,
  limit: number = 100
): Promise<T[]> => {
  const updatedParams = { ...params, skip: page * limit, limit };

  const res = await fetchFn(updatedParams);
  const data = Array.isArray(res?.data) ? res.data : [];

  if (res?.cursor && res.cursor.total > (page + 1) * limit) {
    return data.concat(await fetchAllData(fetchFn, params, page + 1, limit));
  } else {
    return data;
  }
};

// A memoization function that caches the results of API calls with different arguments
let currentUserId: string | null = null;
export function setMemoizationKey(id: string) {
  currentUserId = id;
}

export function memoizeApiFunction<T>(
  apiFunction: (...args: any[]) => Promise<T>
): (...args: Parameters<typeof apiFunction>) => Promise<T> {
  const cache = new Map<string, Promise<T>>();

  function memoizedFunction(
    ...args: Parameters<typeof apiFunction>
  ): Promise<T> {
    const key = JSON.stringify([...args, currentUserId]);
    if (cache.has(key)) {
      // console.log("Using cached result for key:", key);
      return cache.get(key)!;
    } else {
      // console.log("Calling API function for key:", key);
      const resultPromise = apiFunction(...args);
      cache.set(key, resultPromise);
      return resultPromise;
    }
  }

  return memoizedFunction;
}

export const modifyResData = (response) => {
  if (response.status) { // dirty fix for axios retry issue https://github.com/softonic/axios-retry/issues/246
    return response ? response.data || response : null;
  }
  return response
};

export const modifyResError = (error) => {
  return Promise.reject(
    error.response
      ? error.response
        ? error.response.data
        : error.response
      : error
  );
};
