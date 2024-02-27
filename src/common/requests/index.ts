import { api } from '@/core/api';
import { REFERENCES } from '@/utils/contants.util';

export const GetDrawingReferences = async () =>
  api
    .get<{
      references: string[];
    }>('/docs/drawing.json')
    .then((response) => {
      return response.data.references || REFERENCES;
    })
    .catch(() => {
      return REFERENCES;
    });
