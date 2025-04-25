import { Logo } from "../logo";

export const Loader = () => {
  return (
    <div className="flex items-center justify-center h-screen flex-col">
      <div className="loader"></div>
      <Logo className="mt-6" />
    </div>
  );
};
