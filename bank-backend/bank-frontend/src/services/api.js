import axios from "axios";

const API = "http://localhost:8080/api/account";

// --- Existing Single Account Operations ---
export const createAccount = (data) => axios.post(`${API}/create`, data);
export const deposit = (id, amount) => axios.post(`${API}/deposit/${id}/${amount}`);
export const withdraw = (id, amount) => axios.post(`${API}/withdraw/${id}/${amount}`);
export const checkBalance = (id) => axios.get(`${API}/balance/${id}`);

// --- NEW: Dashboard & Analytics Endpoints ---
// Fetches the aggregated balances for the Overview Section
export const getDashboardOverview = () => axios.get(`${API}/overview`);

// Fetches the transaction history for the Recent Activity table
export const getRecentTransactions = () => axios.get(`${API}/transactions/recent`);