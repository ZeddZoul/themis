// This is a simple in-memory store to simulate Firestore for the API server.
// In a real application, these functions would be making actual Firestore calls.

interface RepoDetails {
  repoId: string;
  repoUrl: string;
  encryptedToken: string;
  branch: string;
  userId: string;
}

const mockRepoStore = new Map<string, RepoDetails>();

/**
 * Saves repository details to our mock store.
 * @param {RepoDetails} details The details to save.
 * @returns {Promise<string>} The generated repoId.
 */
export const saveRepoDetails = async (details: Omit<RepoDetails, 'repoId'>): Promise<string> => {
  const repoId = `repo-${Date.now()}`;
  mockRepoStore.set(repoId, { ...details, repoId });
  console.log(`Mock DB: Saved repo details for ${details.repoUrl} with ID ${repoId}`);
  return repoId;
};

/**
 * Retrieves repository details from our mock store.
 * @param {string} repoId The ID of the repository.
 * @returns {Promise<RepoDetails | null>} The repository details or null if not found.
 */
export const getRepoDetails = async (repoId: string): Promise<RepoDetails | null> => {
  const details = mockRepoStore.get(repoId);
  console.log(`Mock DB: Fetched repo details for ID ${repoId}`);
  return details || null;
};
