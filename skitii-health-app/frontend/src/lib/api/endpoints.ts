'use client';

// API Endpoints Constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  PATIENTS: {
    BASE: '/patients',
    GET_ALL: '/patients',
    GET_ONE: (id: string) => `/patients/${id}`,
    CREATE: '/patients',
    UPDATE: (id: string) => `/patients/${id}`,
    DELETE: (id: string) => `/patients/${id}`,
    DEACTIVATE: (id: string) => `/patients/${id}/deactivate`,
    SEARCH: '/patients',
  },
  SESSIONS: {
    BASE: '/sessions',
    CREATE: '/sessions',
    GET_ONE: (id: string) => `/sessions/${id}`,
    GET_BY_PATIENT: (patientId: string) => `/sessions/patient/${patientId}`,
    END: (id: string) => `/sessions/${id}/end`,
    ADD_READING: (id: string) => `/sessions/${id}/reading`,
    ACTIVE: '/sessions/active',
  },
} as const;

export type APIEndpoint = typeof API_ENDPOINTS;