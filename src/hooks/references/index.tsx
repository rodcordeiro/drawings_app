import { GetDrawingReferences } from '@/common/requests';
import React from 'react';

export interface IApp {
  references: string[];
}
const AppContext = React.createContext<IApp>({} as IApp);
type AppProviderProps = {
  children?: any;
};

export function ReferenceHook({
  children,
}: React.PropsWithChildren<AppProviderProps>) {
  const [references, setReferences] = React.useState<string[]>([]);

  React.useEffect(() => {
    GetDrawingReferences()
      .then((response) => {
        setReferences(response);
      })
      .catch((response) => {
        setReferences(response);
      });
  });

  return (
    <>
      <AppContext.Provider
        value={{
          references,
        }}
      >
        {children}
      </AppContext.Provider>
    </>
  );
}

export function useReferences(): IApp {
  return React.useContext<IApp>(AppContext);
}

export default AppContext;
