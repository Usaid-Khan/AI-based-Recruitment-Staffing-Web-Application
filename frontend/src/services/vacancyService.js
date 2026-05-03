import api from './api';

const vacancyService = {
  getOpenVacancies: async () => {
    const response = await api.get('/vacancies');
    return response.data;
  },

  searchVacancies: async (keyword) => {
    const response = await api.get(`/vacancies/search?keyword=${keyword}`);
    return response.data;
  },

  getVacancyById: async (id) => {
    const response = await api.get(`/vacancies/${id}`);
    return response.data;
  },

  applyForVacancy: async (vacancyId) => {
    const response = await api.post(`/applications/vacancy/${vacancyId}`);
    return response.data;
  }
};

export default vacancyService;
