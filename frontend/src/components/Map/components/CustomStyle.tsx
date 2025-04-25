import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

const CustomStyle = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .label-layer {
        filter: grayscale(100%) brightness(40%) invert(100%);
        -webkit-filter: grayscale(100%) brightness(40%) invert(100%);
        mix-blend-mode: screen;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return null;
};

export default CustomStyle;