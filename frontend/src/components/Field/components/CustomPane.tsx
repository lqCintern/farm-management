import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface CustomPaneProps {
  name: string;
  zIndex: number;
}

const CustomPane: React.FC<CustomPaneProps> = ({ name, zIndex }) => {
  const map = useMap();

  useEffect(() => {
    if (!map.getPane(name)) {
      map.createPane(name);
      map.getPane(name)!.style.zIndex = zIndex.toString();
    }
    return () => {
      // Cleanup if needed
    };
  }, [map, name, zIndex]);

  return null;
};

export default CustomPane;
