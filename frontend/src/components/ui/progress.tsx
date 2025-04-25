interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={`relative w-full bg-gray-200 rounded-lg ${className}`}>
      <div
        className="absolute top-0 left-0 h-full bg-green-500 rounded-lg"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
}
