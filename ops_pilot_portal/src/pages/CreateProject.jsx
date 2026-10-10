import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { createProject } from "../api/DashboardtApi";
import { projectIconOptions } from "../components/projects/projectIconOptions";
import useProjectStore from "../store/projectStore";

export default function CreateProject() {
  const navigate = useNavigate();
  const projects = useProjectStore((state) => state.projects);
  const setProjects = useProjectStore((state) => state.setProjects);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [iconKey, setIconKey] = useState(projectIconOptions[0].key);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsCreating(true);
    try {
      const project = await createProject({
        name: projectName.trim(),
        description: description.trim() || null,
        icon_key: iconKey,
      });
      setProjects([...projects, project]);
      toast.success("Project created.");
      navigate("/projects");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Could not create project.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="max-w-4xl pb-8" aria-label="Create project">
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm font-semibold text-slate-800">
          Project name
          <input
            autoFocus
            required
            maxLength={100}
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="e.g. Acme Store"
            className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-800">
          Description
          <textarea
            rows={4}
            maxLength={255}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what this project is for..."
            className="mt-2 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal leading-5 text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">Icon</legend>
          <div role="radiogroup" aria-label="Project icon" className="mt-3 flex flex-wrap gap-3">
            {projectIconOptions.map(({ key, label, Icon, colorClassName }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={iconKey === key}
                aria-label={`${label} icon`}
                title={label}
                onClick={() => setIconKey(key)}
                className={`grid h-11 w-11 place-items-center rounded-md ${colorClassName} transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${iconKey === key ? "ring-2 ring-blue-600 ring-offset-2" : "hover:-translate-y-0.5"}`}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={() => navigate("/projects")}
            className="h-10 rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-60"
          >
            <FolderPlus aria-hidden="true" className="h-4 w-4" />
            {isCreating ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </section>
  );
}