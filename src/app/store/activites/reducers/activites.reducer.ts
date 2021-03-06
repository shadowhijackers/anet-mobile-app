import {Action, createReducer, on} from '@ngrx/store';

import * as ActivitesActions from '../actions/activites.actions';
import {ActivitiesListResponse} from '../../../core/models/http/responses/activities-list.response';
import {StorageKeys, StorageService} from '../../../storage';

export const activitesFeatureKey = 'activites';

export interface State {
  data: ActivitiesListResponse;
  loading: boolean;
}

export const initialState: State = {
  data: null,
  loading: false,
};


export const reducer = createReducer(
  initialState,

  on(ActivitesActions.initActivitess, (state, action) => ({...state, data: action?.data})),
  on(ActivitesActions.loadActivitess, state => ({...state, loading: true})),
  on(ActivitesActions.loadActivitessSuccess, (state, action) => ({...state, data: action.data, error: null, loading: false})),
  on(ActivitesActions.loadActivitessFailure, (state, action) => ({...state, error: action.error, loading: false})),
  on(ActivitesActions.clearActivities, (state) => ({...state, data: null})),
  on(ActivitesActions.cacheActivitess, (state, action) => {
    StorageService.instance.setItem(StorageKeys.cachedActivites, action?.data, true);
    return state;
  })
);

