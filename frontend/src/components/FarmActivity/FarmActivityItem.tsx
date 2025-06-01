import { FarmActivity } from "@/types/labor/types";

function parseDate(dateString: string): string {
  const [day, month, year] = dateString.split("-");
  return `${year}-${month}-${day}`;
}

interface Props {
  activity: FarmActivity;
}

export default function FarmActivityItem({ activity }: Props) {
  return (
    <li className="p-4 rounded-lg bg-gray-100 shadow">
      <h2 className="text-lg font-semibold">{activity.activity_type}</h2>
      <p className="text-sm text-gray-600">{activity.description}</p>
      <p className="text-sm text-gray-600">
      Start Date:{" "}
      {new Date(parseDate(activity.start_date)).toLocaleDateString("en-GB")}
      </p>
      <p className="text-sm text-gray-600">
      End Date:{" "}
      {new Date(parseDate(activity.end_date)).toLocaleDateString("en-GB")}
      </p>
      <p
      className={`text-sm font-bold ${
        activity.status === "Overdue"
      ? "text-red-600"
      : activity.status === "Starting Soon"
      ? "text-yellow-600"
      : activity.status === "Ending Soon"
      ? "text-blue-600"
      : "text-green-600"
      }`}
      >
      Status: {activity.status}
      </p>
    </li>
  );
}
