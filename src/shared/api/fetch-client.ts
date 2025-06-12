type FetchOptions = RequestInit & {
  baseURL?: string;
  timeout?: number;
};

export async function fetchClient(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { baseURL = '', timeout = 10000, ...fetchOptions } = options;
  
  // Construire l'URL complète
  const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
  
  // Options par défaut
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Pour inclure les cookies
  };
  
  // Fusionner les options
  const finalOptions: RequestInit = {
    ...defaultOptions,
    ...fetchOptions,
    headers: {
      ...defaultOptions.headers,
      ...fetchOptions.headers,
    },
  };
  
  // Ajouter le token d'authentification si nécessaire
  // Récupérer le token depuis localStorage (utilisé par Zustand)
  let token = null;
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsedAuth = JSON.parse(authStorage);
      token = parsedAuth.state?.token;
    }
  } catch (error) {
    console.warn('Impossible de récupérer le token depuis localStorage:', error);
  }
  
  if (token) {
    finalOptions.headers = {
      ...finalOptions.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  
  // Créer un AbortController pour le timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Ajouter le signal à l'AbortController
    const response = await fetch(fullUrl, {
      ...finalOptions,
      signal: controller.signal,
    });
    
    return response;
  } catch (error) {
    // Gérer les erreurs spécifiques
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`La requête a expiré après ${timeout}ms`);
      }
      
      // Gérer l'erreur ERR_INSUFFICIENT_RESOURCES
      if (error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
        console.error('Erreur de ressources insuffisantes:', error);
        throw new Error('Le serveur n\'a pas assez de ressources pour traiter la requête. Veuillez réessayer plus tard.');
      }
    }
    
    throw error;
  } finally {
    // Nettoyer le timeout
    clearTimeout(timeoutId);
  }
} 