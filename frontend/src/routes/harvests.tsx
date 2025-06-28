import { MyHarvestsPage, HarvestDetailPage } from '@/pages/Harvests';

export default [
  {
    path: '/my-harvests',
    element: <MyHarvestsPage />,
  },
  {
    path: '/harvests/:id',
    element: <HarvestDetailPage />,
  },
]; 