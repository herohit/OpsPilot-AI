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

export const createService = async (projectId, serviceData) => {
  const response = await api.post(
    `/projects/${projectId}/services`,
    serviceData,
  );

  return response.data;
};

export const updateService = async (projectId, serviceId, serviceData) => {
  const response = await api.patch(
    `/projects/${projectId}/services/${serviceId}`,
    serviceData,
  );

  return response.data;
};

export const deleteService = async (projectId, serviceId) => {
  const response = await api.delete(
    `/projects/${projectId}/services/${serviceId}`,
  );

  return response.data;
};

export const getEnvironments = async () => {
  const response = await api.get("/environments");

  return response.data;
};

export const createEnvironment = async (
  projectId,
  serviceId,
  environmentData,
) => {
  const response = await api.post(
    `/projects/${projectId}/services/${serviceId}/environments`,
    environmentData,
  );

  return response.data;
};

export const updateEnvironment = async (
  projectId,
  serviceId,
  environmentId,
  environmentData,
) => {
  const response = await api.patch(
    `/projects/${projectId}/services/${serviceId}/environments/${environmentId}`,
    environmentData,
  );

  return response.data;
};

export const deleteEnvironment = async (
  projectId,
  serviceId,
  environmentId,
) => {
  const response = await api.delete(
    `/projects/${projectId}/services/${serviceId}/environments/${environmentId}`,
  );

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
