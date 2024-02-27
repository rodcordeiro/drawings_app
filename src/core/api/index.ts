import axios from 'axios';

const api = axios.create({
  baseURL: 'https://rodrigocordeiro.com.br',
  timeout: 30000,
  maxBodyLength: 99999999999999999999999,
  maxContentLength: 99999999999999999999999,
});

export { api };
