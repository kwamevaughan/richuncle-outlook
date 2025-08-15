import { useState, useEffect } from 'react';

export function useProfileData(cachedUser) {
  const [user, setUser] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!cachedUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/users/${cachedUser.id}`);
        const result = await response.json();

        if (result.success) {
          const freshUserData = {
            ...cachedUser,
            ...result.data,
          };
          setUser(freshUserData);

          if (result.data.store_id) {
            try {
              const storesResponse = await fetch('/api/stores');
              const storesResult = await storesResponse.json();
              if (storesResult.success) {
                const userStore = storesResult.data.find(
                  (store) => store.id === result.data.store_id
                );
                setStoreData(userStore);
              }
            } catch (storeError) {
              console.error('Error fetching store data:', storeError);
            }
          }
        } else {
          setUser(cachedUser);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(cachedUser);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [cachedUser]);

  return { user, setUser, storeData, loading };
}
