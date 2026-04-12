export const isAuthorizedUserId = (
  allowedUserIds: string[],
  userId: string | undefined,
): boolean => {
  if (!userId) {
    return false;
  }

  return allowedUserIds.includes(userId);
};
