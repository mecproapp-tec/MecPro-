import React, { PropsWithChildren } from "react";

/**
 * Este wrapper aplica automaticamente as classes `no-text-cursor` e `no-select`
 * em elementos de visualização, para todo o SaaS.
 */
export const NoCursorWrapper: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  return <div className="no-select">{children}</div>;
};