import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "../../components/ui/progress";

interface Task {
  id: number;
  title: string;
  status: "completed" | "in-progress" | "not-started";
}

const tasks: Task[] = [
  { id: 1, title: "Set up database schema", status: "completed" },
  { id: 2, title: "Implement authentication", status: "in-progress" },
  { id: 3, title: "Design frontend layout", status: "not-started" },
  { id: 4, title: "Integrate Google Maps API", status: "not-started" },
  { id: 5, title: "Develop chat feature", status: "in-progress" },
];

export default function Home() {
  const [filter, setFilter] = useState<"all" | "completed" | "in-progress" | "not-started">("all");

  const filteredTasks = filter === "all" ? tasks : tasks.filter((task) => task.status === filter);

  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const totalTasks = tasks.length;
  const progress = (completedTasks / totalTasks) * 100;

  return (
    <div className="p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Project Dashboard</h1>
        <Button className="bg-[#00B207]">Add New Task</Button>
      </header>

      {/* Dashboard */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>
        <div className="bg-[#E6E6E6] p-4 rounded-lg">
          <p className="mb-2">Project Completion: {completedTasks}/{totalTasks} tasks completed</p>
          <Progress value={progress} className="h-4 rounded-lg" />
        </div>
      </section>

      {/* Task Filters */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Tasks</h2>
        <div className="flex space-x-4 mb-4">
          <Button
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-[#00B207]" : "bg-gray-300"}
          >
            All
          </Button>
          <Button
            onClick={() => setFilter("completed")}
            className={filter === "completed" ? "bg-[#00B207]" : "bg-gray-300"}
          >
            Completed
          </Button>
          <Button
            onClick={() => setFilter("in-progress")}
            className={filter === "in-progress" ? "bg-[#00B207]" : "bg-gray-300"}
          >
            In Progress
          </Button>
          <Button
            onClick={() => setFilter("not-started")}
            className={filter === "not-started" ? "bg-[#00B207]" : "bg-gray-300"}
          >
            Not Started
          </Button>
        </div>
      </section>

      {/* Task List */}
      <section>
        <ul className="space-y-4">
          {filteredTasks.map((task) => (
            <li
              key={task.id}
              className={`p-4 rounded-lg ${
                task.status === "completed"
                  ? "bg-green-100"
                  : task.status === "in-progress"
                  ? "bg-yellow-100"
                  : "bg-red-100"
              }`}
            >
              <p className="font-semibold">{task.title}</p>
              <p className="text-sm text-gray-600">Status: {task.status}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
