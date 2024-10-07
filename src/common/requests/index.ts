import { api } from '@/core/api';
import { REFERENCES } from '@/utils/contants.util';
import { toast } from '@backpackapp-io/react-native-toast';

export const GetDrawingReferences = async () =>
  {
    const id = toast.loading("Carregando referências");
  return api
    .get<{
      references: string[];
    }>('/docs/drawing.json')
    .then((response) => {
      toast.dismiss(id);
      if(!response.data.references) toast.error(response.status);
      toast.success("Referências carregadas!")
      return response.data.references || REFERENCES;
    })
    .catch(() => {
      toast.dismiss(id);
      toast.error("Erro ao carregar referências. Carregando referências padrão");
      return REFERENCES;
    });
  }
