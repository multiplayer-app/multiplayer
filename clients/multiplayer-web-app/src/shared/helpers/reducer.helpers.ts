export const setFetchingState = (state, key: string, params = null) => {
  return {
    ...state,
    [key]: { ...state[key], fetching: true, fetched: false  },
  };
};

export const setFetchedState = (state, key, initialData = null) => {
  return {
    ...state,
    [key]: { ...state[key], data: initialData, fetching: false, fetched: true },
  };
};

export const setDataState = (state, key, data) => {
  return {
    ...state,
    [key]: { ...state[key], data, fetched: true, fetching: false },
  };
};

export const putDataState = (state, key, data) => {
  return {
    ...state,
    [key]: {
      ...state[key],
      data: { ...state[key].data, ...data },
      fetched: true,
      fetching: false,
    },
  };
};

export const updateFetchingParams = (state, key: string, params = null) => {
  return {
    ...state,
    [key]: {
      ...state[key],
      params: params ? { ...(state[key].params || {}), ...params } : null,
    },
  };
};
