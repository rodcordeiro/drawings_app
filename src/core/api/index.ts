import axios from 'axios';

const api = axios.create({
  baseURL: 'https://rodrigocordeiro.com.br',
  timeout: 30000,
});

export { api };
