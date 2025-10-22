import { Request, Response, NextFunction } from 'express';
import { verifyUserAuthorization } from './verify-user-authorization';
import { verifyTaskAssignment } from './verify-task-assignment';

function verifyRoleOrAssignment(roles: string[]) {
  const roleCheck = verifyUserAuthorization(roles);
  const assignmentCheck = verifyTaskAssignment();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Promise.resolve(roleCheck(req, res, next));
    } catch (err) {
      try {
        await Promise.resolve(assignmentCheck(req, res, next));
      } catch (err2) {
        return next(err2); 
      } 
    }
  };
}

export { verifyRoleOrAssignment };