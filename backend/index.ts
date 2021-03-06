import Env from 'dotenv';
// Load production environment files
Env.config({ path: "/shared/nonsecret.env" });
Env.config({ path: "/shared/prod.env" });
Env.config({ path: `${__dirname}/../shared/dev.env` });

import Koa from 'koa';
import Router from 'koa-router';
import send from 'koa-send';
import Serve from 'koa-static';
import main from './routes/main';

const App = new Koa();
const api_r = new Router();
const router = new Router();

router.get("/", main);

// Set the API's prefix to /api
api_r.use("/api", router.routes());

// Allow CORS in development since the frontend and backend are served separately
// require is used so that cors is not a production dependency
if (process.env.TYPE == "development") App.use(require('@koa/cors')());

App
    .use(Serve("./res", { index: "index.html" }))
    .use(api_r.routes())
    ;

// In production, if there's no other clear option, serve index.html
if (process.env.TYPE != "development") App.use(async ctx => await send(ctx, "./res/index.html"));

App.listen(parseInt(process.env.PORT || "3000"));