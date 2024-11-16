import { v4 as uuidv4 } from 'uuid';

export function generateRandomId(): string {
  const uuid: string = uuidv4();

  return uuid;
}
