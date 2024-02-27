import { api } from '@/core/api';
import { REFERENCES } from '@/utils/contants.util';

export const GetDrawingReferences = async () =>
  api
    .get<{
      reference: string[];
    }>('/docs/drawing.json')
    .then(({ data }) => data.reference || REFERENCES)
    .catch(() => REFERENCES);
