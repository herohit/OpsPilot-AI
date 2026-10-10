import api from "./client";

export const getProjects = async () => {
  const response = await api.get("/projects");

  return response.data;
};

export const getProject = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);

  return response.data;
};

export const createProject = async (projectData) => {
  const response = await api.post("/projects", projectData);

  return response.data;
};

export const updateProject = async (projectId, projectData) => {
  const response = await api.patch(`/projects/${projectId}`, projectData);

  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);

  return response.data;
};

export const getServices = async () => {
  const response = await api.get("/services");

  return response.data;
};

export const getEnvironments = async () => {
  const response = await api.get("/environments");

  return response.data;
};

export const getDeployments = async () => {
  const response = await api.get("/deployments");

  return response.data;
};

export const getLogSources = async (projectId, serviceId, environmentId) => {
  const response = await api.get(
    `/projects/${projectId}/services/${serviceId}/environments/${environmentId}/log-sources`,
  );

  return response.data;
};
