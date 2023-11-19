import { api } from '@/core/api';
import { DrawingTypes } from '../types/drawing.types';

import { references } from '../utils/drawing.util';

export const GetDrawingReferences = async () =>
  api
    .get<DrawingTypes.ApiResponse>('/docs/drawing.json')
    .then(({ data }) => data.reference || references)
    .catch(() => references);
