import logo from './../../assert/logo.png'
import React from 'react';

export function Logo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
   <img src={logo.src} alt="Chemical Imbalance Logo" {...props} />
  );
}
