import { useState, useEffect } from 'react';

export const useUserStatus = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const response = await fetch('/api/user-status');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Expected JSON response');
        }

        const data = await response.json();

        if (data.isImageApproved) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStatus();
  }, []);

  return { isAuthorized, isLoading };
};