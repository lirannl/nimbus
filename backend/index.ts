import Koa from 'koa';
import Router from 'koa-router';
import Serve from 'koa-static';
import main from './routes/main';
import Env from 'dotenv';

Env.config({path: "/shared/nonsecret.env"});
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
    .use(Serve("./res"))
    .use(api_r.routes())
    ;

App.listen(parseInt(process.env.PORT || "3000"));