import api from "./client";

export const getProjects = async () => {
  const response = await api.get("/projects");

  return response.data;
};

export const createProject = async (projectData) => {
  const response = await api.post("/projects", projectData);

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