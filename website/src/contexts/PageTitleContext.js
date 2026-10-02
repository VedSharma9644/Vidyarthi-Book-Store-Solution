import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const PageTitleContext = createContext({
  pageTitle: '',
  setPageTitle: () => {},
});

export function PageTitleProvider({ children }) {
  const [pageTitle, setPageTitleState] = useState('');

  const setPageTitle = useCallback((title) => {
    const next = title != null && String(title).trim() ? String(title).trim() : '';
    setPageTitleState(next);
  }, []);

  const value = useMemo(
    () => ({ pageTitle, setPageTitle }),
    [pageTitle, setPageTitle]
  );

  return (
    <PageTitleContext.Provider value={value}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitleContext() {
  return useContext(PageTitleContext);
}

/**
 * Set the sticky header title for the current page (clears on unmount).
 * @param {string} title
 */
export function usePageTitle(title) {
  const { setPageTitle } = usePageTitleContext();

  useEffect(() => {
    setPageTitle(title);
    return () => setPageTitle('');
  }, [title, setPageTitle]);
}
