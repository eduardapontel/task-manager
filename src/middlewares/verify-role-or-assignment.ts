import { Request, Response, NextFunction } from 'express';
import { verifyUserAuthorization } from './verify-user-authorization';
import { verifyTaskAssignment } from './verify-task-assignment';

function verifyRoleOrAssignment(roles: string[]) {
  const roleCheck = verifyUserAuthorization(roles);
  const assignmentCheck = verifyTaskAssignment();

  return async (request: Request, response: Response, next: NextFunction) => {
  try {
    await roleCheck(request, response, next);
  } catch {
    await assignmentCheck(request, response, next);
  }
};
}

export { verifyRoleOrAssignment };