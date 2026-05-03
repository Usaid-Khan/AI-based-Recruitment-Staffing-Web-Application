import api from './api';

const candidateService = {
  getMyProfile: async () => {
    const response = await api.get('/candidates/me');
    return response.data;
  },

  getMyApplications: async () => {
    const response = await api.get('/applications/my');
    return response.data;
  },

  updateProfile: async (id, profileData) => {
    const response = await api.put(`/candidates/${id}`, profileData);
    return response.data;
  },

  uploadResume: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/candidates/${id}/resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default candidateService;
