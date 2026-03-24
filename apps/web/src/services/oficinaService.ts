export interface OficinaData {
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  logo: string | null;
}

export const getOficinaData = (userId: string): OficinaData | null => {
  try {
    const key = `oficina_${userId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Erro ao carregar dados da oficina:", error);
    return null;
  }
};

export const saveOficinaData = (userId: string, data: OficinaData): void => {
  const key = `oficina_${userId}`;
  localStorage.setItem(key, JSON.stringify(data));
};

export const uploadLogo = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};