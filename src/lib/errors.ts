export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("ECONNREFUSED") || error.message.includes("MONGODB_URI")) {
      return "MongoDB is not reachable. Start MongoDB or set MONGODB_URI in .env.local.";
    }
    return error.message;
  }
  return "Unexpected server error";
}
