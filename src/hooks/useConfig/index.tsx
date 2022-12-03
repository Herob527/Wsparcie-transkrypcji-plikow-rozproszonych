
import {
  useQuery,
} from 'react-query';

//const configClient = new QueryClient();

const API_ADDRESS = 'http://localhost:5002';

function useConfig(endpoint = 'config') {
  const config = useQuery(
    'configData',
    async () =>
      await fetch(`${API_ADDRESS}/${endpoint}`, {
        method: 'GET',
      })
        .then((res) => res.json())
        .then((data) => data)
        .catch((error) => error),
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  return config;
}

export default useConfig;
