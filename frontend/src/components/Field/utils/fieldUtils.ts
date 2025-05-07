// Hàm thay đổi màu ngẫu nhiên cho các polygon
export const getRandomColor = () => {
  const colors = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#FF33A8",
    "#33FFF5",
    "#F533FF",
    "#FFD133",
    "#33B4FF",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Hàm sắp xếp các field
export const sortFields = (fields: any[], sortBy: string) => {
  return [...fields].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "area") {
      return b.area - a.area;
    } else if (sortBy === "date") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return 0;
  });
};

// Hàm filter fields dựa trên searchTerm
export const filterFields = (fields: any[], searchTerm: string) => {
  if (!searchTerm.trim()) return fields;

  return fields.filter(
    (field) =>
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
};
