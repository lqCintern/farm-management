import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface CustomPaneProps {
  name: string;
  zIndex: number;
}

const CustomPane = ({ name, zIndex }: CustomPaneProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map.getPane(name)) {
      map.createPane(name);
      map.getPane(name)!.style.zIndex = zIndex.toString();
    }
    return () => {
      // Không có cleanup cần thiết
    };
  }, [map, name, zIndex]);

  return null;
};

export default CustomPane;
