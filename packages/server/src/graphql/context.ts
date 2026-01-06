import { Request, Response } from "express";
import { PubSub } from "graphql-subscriptions";

export const pubSub = new PubSub();

export interface Context {
  req: Request;
  res: Response;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  pubSub: PubSub;
}
