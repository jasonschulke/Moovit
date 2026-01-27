// Exercise GIF URLs
// Add your own GIF URLs here - these can be from any source that allows hotlinking
// Popular sources: Giphy, Tenor, Imgur, or self-hosted

const exerciseGifs: Record<string, string> = {
  // Example format:
  // 'Exercise Name': 'https://example.com/exercise.gif',

  // Add GIF URLs for your exercises here
  // The key should match the exercise name exactly
};

export function getExerciseGifUrl(exerciseName: string): string | null {
  return exerciseGifs[exerciseName] || null;
}

// For backwards compatibility with the async version
export async function fetchExerciseGif(exerciseName: string): Promise<string | null> {
  return getExerciseGifUrl(exerciseName);
}
