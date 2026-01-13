import "reflect-metadata";
import express from "express";
import http from "http";
import path from "path";
import cors from "cors";
import { json } from "body-parser";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { buildSchema } from "type-graphql";
import { clerkMiddleware } from "./middleware/clerk";
import { initPostHog } from "./lib/posthog";
import { AppDataSource } from "./data-source";
import { Context, pubSub } from "./graphql/context";
import dotenv from "dotenv";

// Import resolvers
import { AuthResolver } from "./graphql/resolvers/auth.resolver";
import { ProgramResolver } from "./graphql/resolvers/program.resolver";
import { TeamResolver } from "./graphql/resolvers/team.resolver";
import { TaskResolver } from "./graphql/resolvers/task.resolver";
import { RegistrationResolver } from "./graphql/resolvers/registration.resolver";
import { AttendanceResolver } from "./graphql/resolvers/attendance.resolver";
import { UserResolver } from "./graphql/resolvers/user.resolver";
import { ReportResolver } from "./graphql/resolvers/report.resolver";
import { SubscriptionResolver } from "./graphql/resolvers/subscription.resolver";
import { WorkProgramResolver } from "./graphql/resolvers/workProgram.resolver";
import { WeeklyReportResolver } from "./graphql/resolvers/weeklyReport.resolver";
import { AdminResolver } from "./graphql/resolvers/admin.resolver";
import { ActivityResolver } from "./graphql/resolvers/activity.resolver";
import { LogsheetResolver } from "./graphql/resolvers/logsheet.resolver";
import uploadRouter from "./routes/upload";

dotenv.config();

initPostHog();

async function startServer() {
  // Initialize TypeORM
  await AppDataSource.initialize();
  console.log("✅ TypeORM initialized");

  const app = express();
  const httpServer = http.createServer(app);

  // Build TypeGraphQL schema
  const schema = await buildSchema({
    resolvers: [
      AuthResolver,
      ProgramResolver,
      TeamResolver,
      TaskResolver,
      RegistrationResolver,
      AttendanceResolver,
      UserResolver,
      ReportResolver,
      SubscriptionResolver,
      WorkProgramResolver,
      WeeklyReportResolver,
      AdminResolver,
      ActivityResolver,
      LogsheetResolver,
    ],
    validate: false, // Set to true to enable class-validator
    emitSchemaFile: path.resolve(__dirname, "../schema.graphql"),
  });

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const server = new ApolloServer<Context>({
    schema,
    introspection: process.env.NODE_ENV !== "production",
    formatError: (error) => {
      // Ensure error is properly formatted for Apollo Server
      const message = error.message || "An unknown error occurred";
      const code = error.extensions?.code || "INTERNAL_SERVER_ERROR";

      // Log error for debugging
      console.error("GraphQL Error:", {
        message,
        code,
        path: error.path,
        extensions: error.extensions,
      });

      return {
        message,
        code,
        path: error.path,
        extensions: {
          ...error.extensions,
          code,
        },
      };
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  // Use WebSocket server for subscriptions
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx, msg, args): Promise<Context> => {
        // Extract auth from connection params (if using auth in WebSocket)
        // For now, we'll use a simplified context for subscriptions
        return {
          req: {} as express.Request,
          res: {} as express.Response,
          pubSub,
        };
      },
    },
    wsServer
  );

  await server.start();

  // Enable CORS
  app.use(cors({
    origin: true, // Reflect request origin (useful for development)
    credentials: true,
  }));

  // Basic security middleware - disabled COOP/COEP to avoid issues with popups and cross-origin resources
  app.use((req, res, next) => {
    // res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    // res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    next();
  });

  app.use(
    "/graphql",
    json(),
    clerkMiddleware, // Clerk auth middleware
    expressMiddleware(server, {
      context: async ({ req, res }): Promise<Context> => {
        const auth = (req as any).auth;
        if (auth) {
          console.log(`[Context] Creating context for ${auth.email} (Role: ${auth.role}, ID: ${auth.userId})`);
        } else {
          console.log('[Context] No auth found in request');
        }
        return {
          req,
          res,
          userId: auth?.userId,
          userEmail: auth?.email,
          userRole: auth?.role,
          pubSub,
        };
      },
    })
  );

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // File upload routes
  app.use("/api/upload", uploadRouter);
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  const PORT = process.env.PORT || 4000;
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
