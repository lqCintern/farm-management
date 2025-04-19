import { FarmActivity } from "@/types";

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
          activity.status_label === "Overdue"
            ? "text-red-600"
            : activity.status_label === "Starting Soon"
            ? "text-yellow-600"
            : activity.status_label === "Ending Soon"
            ? "text-blue-600"
            : "text-green-600"
        }`}
      >
        Status: {activity.status_label}
      </p>
      {activity.status_details.overdue && (
        <p className="text-sm text-red-600">
          Overdue by {activity.status_details.overdue_days} days
        </p>
      )}
      {activity.status_details.starting_soon && (
        <p className="text-sm text-yellow-600">Starting Soon</p>
      )}
      {activity.status_details.ending_soon && (
        <p className="text-sm text-blue-600">Ending Soon</p>
      )}
    </li>
  );
}
