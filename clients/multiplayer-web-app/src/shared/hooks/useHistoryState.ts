
import { DiffPatcher } from 'jsondiffpatch';
import { useMemo, useState, useCallback } from 'react';

import { IUseHistoryState, IHistory } from 'shared/models/interfaces';
import { UseHistoryState } from 'shared/models/types';
import { clone } from 'shared/utils';

const patcher = new DiffPatcher({ objectHash: (obj) => obj.id });
const initialHistory = { states: [], index: 0, canUndo: false, canRedo: false };

const useHistoryState = <T>(initialState: T): UseHistoryState<T> => {

  const [state, setState] = useState<IUseHistoryState<T>>({
    data: initialState,
    history: initialHistory,
  });

  const getState = (prev: any) => {
    return clone({ nodes: prev.data.nodes, edges: prev.data.edges });
  };

  const undo = useCallback(() => {
    setState((prev: IUseHistoryState<T>) => {
      if (!prev.history.canUndo) return prev;
      const delta = prev.history.states[prev.history.index];
      const { nodes, edges } = patcher.unpatch(getState(prev), delta);
      const index = prev.history.index - 1;
      const history = {
        index,
        states: prev.history.states,
        canUndo: index >= 0,
        canRedo: true,
      };
      return { data: { ...prev.data, nodes, edges }, history };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev: IUseHistoryState<T>): IUseHistoryState<T> => {
      if (!prev.history.canRedo) return prev;
      const index = prev.history.index + 1;
      const delta = prev.history.states[index];
      const { nodes, edges } = patcher.patch(getState(prev), delta);
      const history = {
        index,
        states: prev.history.states,
        canUndo: true,
        canRedo: index < prev.history.states.length - 1,
      };
      return { data: { ...prev.data, nodes, edges }, history };
    });
  }, []);

  const pushHistory = (prevState: any, newState: any, history: IHistory): IHistory => {
    if (
      prevState.nodes === newState.nodes &&
      prevState.edges === newState.edges
    )
      return history;
    const delta = patcher.diff(
      { nodes: prevState.nodes, edges: prevState.edges },
      { nodes: newState.nodes, edges: newState.edges }
    );
    if (!delta) return history;
    history.states.splice(history.index + 1, Infinity);
    const states = [...history.states, delta];
    const index = states.length - 1;
    return { states, index: index, canUndo: true, canRedo: false };
  };

  const setStateWrapper = useCallback((cb: any): void => {
    setState((prev: IUseHistoryState<T>): IUseHistoryState<T> => {
      const data = typeof cb === 'function' ? cb(prev.data) : cb;
      const history =
        data === prev.data
          ? prev.history
          : pushHistory(prev.data, data, prev.history);
      return { data, history };
    });
  }, []);

  const setInitialState = useCallback((data: T) => {
    setState({ data, history: initialHistory });
  }, []);

  const val = useMemo(
    (): UseHistoryState<T> => [
      state.data,
      setStateWrapper,
      setInitialState,
      {
        undo,
        redo,
        canUndo: state.history.canUndo,
        canRedo: state.history.canRedo,
      },
    ],
    [
      redo,
      setInitialState,
      setStateWrapper,
      state.data,
      state.history.canRedo,
      state.history.canUndo,
      undo,
    ]
  );
  return val;
};

export default useHistoryState;
